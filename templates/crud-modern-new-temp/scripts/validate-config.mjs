import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const allowedTypes = new Set([
  "text",
  "password",
  "email",
  "phone",
  "url",
  "textarea",
  "number",
  "currency",
  "percentage",
  "rating",
  "select",
  "radio",
  "color",
  "multi-select",
  "tags",
  "checkbox-group",
  "checkbox",
  "toggle",
  "date",
  "time",
  "datetime",
  "file",
  "image",
  "avatar",
  "address",
  "json",
  "reference",
]);

const optionTypes = new Set(["select", "radio", "multi-select", "checkbox-group"]);
const systemKeys = new Set(["id", "created_at", "updated_at", "created_by", "organization_id"]);
const keyPattern = /^[a-z0-9_]+$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function loadPortalConfig() {
  const file = resolve("src/portal-config.json");
  return JSON.parse(await readFile(file, "utf8"));
}

export function validatePortalConfig(config) {
  assert(config && typeof config === "object", "Config must be a JSON object");
  for (const key of [
    "portalName",
    "appName",
    "industry",
    "logoInitials",
    "theme",
    "loginPage",
    "routes",
    "dashboard",
    "company",
    "support",
    "featureFlags",
    "generatedModules",
  ]) {
    assert(config[key] !== undefined, `Missing top-level key: ${key}`);
  }

  assert(Array.isArray(config.generatedModules), "generatedModules must be an array");
  assert(config.theme.primary, "theme.primary is required");
  assert(config.routes.loginPath, "routes.loginPath is required");
  assert(config.routes.appBasePath, "routes.appBasePath is required");
  assert(config.routes.dashboardPath, "routes.dashboardPath is required");
  assert(config.routes.profilePath, "routes.profilePath is required");

  const moduleIds = new Set();
  for (const module of config.generatedModules) {
    assert(keyPattern.test(module.id), `Invalid module id: ${module.id}`);
    assert(keyPattern.test(module.tableName), `Invalid tableName for ${module.id}`);
    assert(!moduleIds.has(module.id), `Duplicate module id: ${module.id}`);
    moduleIds.add(module.id);
    assert(module.singularName, `${module.id} missing singularName`);
    assert(module.pluralName, `${module.id} missing pluralName`);
    assert(module.icon, `${module.id} missing icon`);
    assert(Array.isArray(module.fields), `${module.id} fields must be an array`);
    assert(Array.isArray(module.listColumns), `${module.id} listColumns must be an array`);
    assert(module.listColumns.length >= 3 && module.listColumns.length <= 5, `${module.id} listColumns must contain 3-5 keys`);
    assert(module.tableFeatures, `${module.id} missing tableFeatures`);
    assert(module.permissions?.read && module.permissions?.write && module.permissions?.delete, `${module.id} missing permissions`);

    const fieldKeys = new Set();
    for (const field of module.fields) {
      assert(keyPattern.test(field.key), `${module.id}.${field.key} must be snake_case`);
      assert(!systemKeys.has(field.key), `${module.id}.${field.key} uses a reserved system key`);
      assert(!fieldKeys.has(field.key), `${module.id} duplicate field key: ${field.key}`);
      fieldKeys.add(field.key);
      assert(field.label, `${module.id}.${field.key} missing label`);
      assert(allowedTypes.has(field.type), `${module.id}.${field.key} has unsupported type: ${field.type}`);
      assert(typeof field.required === "boolean", `${module.id}.${field.key} required must be boolean`);
      if (optionTypes.has(field.type)) {
        assert(Array.isArray(field.options) && field.options.length > 0, `${module.id}.${field.key} requires options`);
      } else {
        assert(field.options === undefined, `${module.id}.${field.key} must not define options`);
      }
    }

    for (const column of module.listColumns) {
      assert(fieldKeys.has(column), `${module.id} listColumns contains unknown key: ${column}`);
    }

    const firstSearch = module.listColumns
      .map((column) => module.fields.find((field) => field.key === column))
      .find((field) => ["text", "email", "phone", "select"].includes(field?.type));
    assert(firstSearch, `${module.id} must expose one text/email/phone/select list column for search`);

    const dashboardBreakdown = module.fields.find((field) => field.type === "select" || field.type === "radio");
    assert(dashboardBreakdown, `${module.id} must include at least one select or radio field`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = await loadPortalConfig();
    validatePortalConfig(config);
    console.log("portal-config.json is valid");
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
