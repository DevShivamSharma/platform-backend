const FIELD_TYPE_SQL = {
  text: "TEXT",
  password: "TEXT",
  email: "TEXT",
  phone: "TEXT",
  url: "TEXT",
  textarea: "TEXT",
  number: "NUMERIC",
  currency: "NUMERIC",
  percentage: "NUMERIC",
  rating: "NUMERIC",
  select: "TEXT",
  radio: "TEXT",
  color: "TEXT",
  "multi-select": "TEXT[]",
  tags: "TEXT[]",
  "checkbox-group": "TEXT[]",
  checkbox: "BOOLEAN",
  toggle: "BOOLEAN",
  date: "DATE",
  time: "TIME",
  datetime: "TIMESTAMPTZ",
  file: "TEXT",
  image: "TEXT",
  avatar: "TEXT",
  address: "JSONB",
  json: "JSONB",
  reference: "UUID",
};

const RESERVED_COLUMNS = new Set([
  "id",
  "created_at",
  "updated_at",
  "created_by",
]);

export function tableNameForModule(module) {
  return String(module.tableName || module.id || module.pluralName || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

function sqlIdentifier(value) {
  const cleaned = String(value || "").replace(/"/g, '""');
  if (!cleaned) {
    throw new Error("SQL identifier cannot be empty.");
  }
  return `"${cleaned}"`;
}

function columnNameForField(field) {
  return String(field.key || field.label || "")
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function columnDefinition(field) {
  const columnName = columnNameForField(field);
  if (!columnName || RESERVED_COLUMNS.has(columnName.toLowerCase())) {
    return null;
  }

  const sqlType = FIELD_TYPE_SQL[field.type] || "TEXT";
  const required = field.required ? " NOT NULL" : "";
  return `  ${sqlIdentifier(columnName)} ${sqlType}${required}`;
}

// Idempotent migration: CREATE TABLE IF NOT EXISTS does NOT add new columns to an
// already-existing table. So for any table that was created in an earlier generate
// run, newly-added fields would never get a column (causing PostgREST's
// "Could not find the '<col>' column ... in the schema cache" error). These
// ALTER ... ADD COLUMN IF NOT EXISTS statements backfill missing columns safely.
// NOT NULL is intentionally omitted here — adding a NOT NULL column to a table that
// already has rows would fail; the CREATE path still enforces NOT NULL on fresh tables.
function alterColumnsSql(module, tableIdentifier) {
  return (module.fields || [])
    .map((field) => {
      const columnName = columnNameForField(field);
      if (!columnName || RESERVED_COLUMNS.has(columnName.toLowerCase())) {
        return null;
      }
      const sqlType = FIELD_TYPE_SQL[field.type] || "TEXT";
      return `ALTER TABLE ${tableIdentifier} ADD COLUMN IF NOT EXISTS ${sqlIdentifier(
        columnName
      )} ${sqlType};`;
    })
    .filter(Boolean)
    .join("\n");
}

function tableSql(module) {
  const tableName = tableNameForModule(module);
  if (!tableName) {
    throw new Error(`Invalid table name for module "${module.pluralName || module.id}".`);
  }

  const columns = (module.fields || [])
    .map(columnDefinition)
    .filter(Boolean);

  const tableIdentifier = `public.${sqlIdentifier(tableName)}`;
  const triggerName = sqlIdentifier(`${tableName}_set_updated_at`);
  const policyName = sqlIdentifier(`authenticated_full_access_${tableName}`);
  const alterColumns = alterColumnsSql(module, tableIdentifier);

  return `
CREATE TABLE IF NOT EXISTS ${tableIdentifier} (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "created_by" UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL${columns.length ? "," : ""}
${columns.join(",\n")}
);

-- Backfill any columns missing from a pre-existing table (see alterColumnsSql).
${alterColumns}

ALTER TABLE ${tableIdentifier} ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ${policyName} ON ${tableIdentifier};
CREATE POLICY ${policyName}
  ON ${tableIdentifier}
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON ${tableIdentifier} TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ${tableIdentifier} TO service_role;

DROP TRIGGER IF EXISTS ${triggerName} ON ${tableIdentifier};
CREATE TRIGGER ${triggerName}
  BEFORE UPDATE ON ${tableIdentifier}
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
`.trim();
}

// Generic, injection-safe aggregation helpers consumed by the portal dashboard
// widgets (src/shared/components/dashboard/dashboard-stats.tsx). They run as
// SECURITY INVOKER so the caller's RLS policies still apply, and they validate
// the table/column against information_schema before building any dynamic SQL.
const DASHBOARD_FUNCTIONS_SQL = `
CREATE OR REPLACE FUNCTION public.portal_group_count(
  p_table text, p_column text, p_limit int DEFAULT 8
)
RETURNS TABLE(label text, value bigint)
LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
BEGIN
  IF to_regclass('public.' || quote_ident(p_table)) IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN RETURN; END IF;
  RETURN QUERY EXECUTE format(
    'SELECT COALESCE(NULLIF(%1$I::text, %3$L), %4$L) AS label, count(*)::bigint AS value
       FROM public.%2$I
      GROUP BY 1 ORDER BY 2 DESC LIMIT %5$s',
    p_column, p_table, '', 'Unspecified', GREATEST(1, LEAST(p_limit, 50))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_sum(p_table text, p_column text)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
DECLARE result numeric;
BEGIN
  IF to_regclass('public.' || quote_ident(p_table)) IS NULL THEN RETURN 0; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN RETURN 0; END IF;
  EXECUTE format('SELECT COALESCE(SUM(%1$I), 0) FROM public.%2$I', p_column, p_table) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.portal_time_series(
  p_table text, p_column text, p_bucket text DEFAULT 'day'
)
RETURNS TABLE(bucket timestamptz, value bigint)
LANGUAGE plpgsql STABLE SECURITY INVOKER AS $$
DECLARE b text;
BEGIN
  b := lower(coalesce(p_bucket, 'day'));
  IF b NOT IN ('day', 'week', 'month') THEN b := 'day'; END IF;
  IF to_regclass('public.' || quote_ident(p_table)) IS NULL THEN RETURN; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table AND column_name = p_column
  ) THEN RETURN; END IF;
  RETURN QUERY EXECUTE format(
    'SELECT date_trunc(%3$L, %1$I)::timestamptz AS bucket, count(*)::bigint AS value
       FROM public.%2$I WHERE %1$I IS NOT NULL
      GROUP BY 1 ORDER BY 1',
    p_column, p_table, b
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.portal_group_count(text, text, int) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.portal_sum(text, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.portal_time_series(text, text, text) TO authenticated, service_role;
`.trim();

export function generateSQL(portalConfig) {
  const modules = portalConfig?.modules || [];
  if (!modules.length) {
    throw new Error("portalConfig.modules must contain at least one module.");
  }

  return `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

${modules.map(tableSql).join("\n\n")}

${DASHBOARD_FUNCTIONS_SQL}

-- Tell PostgREST to refresh its schema cache so newly added tables/columns are
-- immediately usable via the REST API (prevents stale "schema cache" errors).
NOTIFY pgrst, 'reload schema';
`.trim();
}
