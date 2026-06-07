import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageBreadcrumb } from "@/shared/components/PageBreadcrumb";
import { FormBuilder } from "@/shared/components/form/FormBuilder";
import type { GeneratedModule } from "@/lib/config.types";
import { modulePath } from "@/lib/config";
import { toFormFields } from "./fieldConfig";
import { buildPayload, buildSchema, buildDefaults } from "@/lib/validation";
import { getRecord, createRecord, updateRecord } from "@/lib/dataStore";
import { notify } from "@/lib/toast";

export function CrudFormRenderer({ module, mode }: { module: GeneratedModule; mode: "add" | "edit" }) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [record, setRecord] = useState<Record<string, unknown> | null>(null);

  const formFields = useMemo(() => toFormFields(module.fields), [module]);
  const schema = useMemo(() => buildSchema(module.fields), [module]);
  const defaults = useMemo(() => buildDefaults(module.fields), [module]);
  const listPath = modulePath(module);

  useEffect(() => {
    if (mode !== "edit" || !id) return;
    let active = true;
    setIsLoading(true);
    getRecord(module.tableName, id)
      .then((result) => active && setRecord(result as Record<string, unknown> | null))
      .catch(() => active && notify.error("Failed to load record"))
      .finally(() => active && setIsLoading(false));
    return () => {
      active = false;
    };
  }, [mode, id, module.tableName]);

  const defaultValues = useMemo(() => {
    if (mode === "edit" && record) return { ...defaults, ...record };
    return defaults;
  }, [mode, record, defaults]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const payload = buildPayload(module.fields, data);
      if (mode === "add") {
        await createRecord(module.tableName, payload);
        notify.created(module.singularName);
      } else if (id) {
        await updateRecord(module.tableName, id, payload);
        notify.updated(module.singularName);
      }
      navigate(listPath);
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageBreadcrumb
        items={[
          { label: module.pluralName, onClick: () => navigate(listPath) },
          { label: mode === "add" ? `New ${module.singularName}` : `Edit ${module.singularName}` },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto pb-6"
      >
        <Card className="w-full max-w-4xl shrink-0 overflow-hidden rounded-2xl border-border/60 shadow-sm">
          <CardHeader className="border-b border-border/60 bg-muted/30 px-8 py-5">
            <CardTitle className="text-base font-semibold tracking-tight">
              {mode === "add" ? `Create ${module.singularName}` : `Edit ${module.singularName}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-8 py-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <FormBuilder
                fields={formFields}
                schema={schema}
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel={mode === "add" ? `Create ${module.singularName}` : "Save Changes"}
                onCancel={() => navigate(listPath)}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
