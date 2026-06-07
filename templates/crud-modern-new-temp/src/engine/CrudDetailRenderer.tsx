import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageBreadcrumb } from "@/shared/components/PageBreadcrumb";
import { useAuth } from "@/core/auth/auth.context";
import type { GeneratedFieldConfig, GeneratedModule } from "@/lib/config.types";
import { editPath, getWritePermission, modulePath } from "@/lib/config";
import { formatCurrency, formatDate, formatDateTime, formatTime, humanize } from "@/lib/utils";
import { getRecord } from "@/lib/dataStore";

function displayValue(field: GeneratedFieldConfig, value: unknown) {
  switch (field.type) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return value == null || value === "" ? "-" : `${Number(value)}%`;
    case "date":
      return formatDate(value);
    case "time":
      return formatTime(value);
    case "datetime":
      return formatDateTime(value);
    case "toggle":
    case "checkbox":
      return value === true || value === "true" ? "Yes" : "No";
    case "select":
    case "radio":
      return value ? <Badge variant="secondary">{humanize(String(value))}</Badge> : "-";
    case "tags":
    case "multi-select":
    case "checkbox-group": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return arr.length ? (
        <div className="flex flex-wrap gap-1">
          {arr.map((item) => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
        </div>
      ) : "-";
    }
    case "address":
    case "json":
      return value ? (
        <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : "-";
    case "image":
    case "avatar":
      return value ? <img src={String(value)} alt="" className="h-20 w-20 rounded-xl border object-cover" /> : "-";
    default:
      return value == null || value === "" ? "-" : String(value);
  }
}

export function CrudDetailRenderer({ module }: { module: GeneratedModule }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const listPath = modulePath(module);
  const canWrite = hasPermission(getWritePermission(module));

  useEffect(() => {
    if (!id) return;
    let active = true;
    getRecord(module.tableName, id)
      .then((result) => active && setRecord(result as Record<string, unknown> | null))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [id, module.tableName]);

  const title = record
    ? String(record[module.fields[0]?.key] ?? `${module.singularName} detail`)
    : module.singularName;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageBreadcrumb
        items={[
          { label: module.pluralName, onClick: () => navigate(listPath) },
          { label: title },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pb-6"
      >
        <Card className="w-full max-w-4xl shrink-0 overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 bg-muted/30 px-8 py-5">
            <CardTitle className="text-base font-semibold tracking-tight">{title}</CardTitle>
            {record && canWrite && id && (
              <Button size="sm" variant="outline" onClick={() => navigate(editPath(module, id))}>
                <Pencil className="mr-1.5 h-4 w-4" /> Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="px-8 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : !record ? (
              <EmptyState title="Record not found" description="It may have been removed." />
            ) : (
              <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                {module.fields.map((field) => (
                  <div key={field.key} className={field.width === "full" ? "border-b border-border/40 pb-3 sm:col-span-2" : "border-b border-border/40 pb-3"}>
                    <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="mt-1 text-sm text-foreground">{displayValue(field, record[field.key])}</dd>
                  </div>
                ))}
              </dl>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
