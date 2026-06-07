import { useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Loader2, Check } from "lucide-react";
import { FormFieldComponent } from "./FormField";
import type { FieldConfig } from "./form.types";
import type { z } from "zod/v4";

interface FormBuilderProps {
  fields: FieldConfig[];
  schema: z.ZodType<Record<string, unknown>>;
  defaultValues?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}

export function FormBuilder({
  fields,
  schema,
  defaultValues = {},
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
}: FormBuilderProps) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema as unknown as Parameters<typeof zodResolver>[0]),
    defaultValues: defaultValues as Record<string, unknown>,
  });

  const watchedValues = watch();

  const visibleFields = fields.filter((field) => {
    if (field.hidden) return false;
    if (field.dependsOn) {
      return watchedValues[field.dependsOn.field] === field.dependsOn.value;
    }
    return true;
  });

  const hasCategorized = visibleFields.some((f) => f.category);

  const categories = useMemo(() => {
    if (!hasCategorized) return null;
    const order: string[] = [];
    const map: Record<string, FieldConfig[]> = {};
    for (const field of visibleFields) {
      const cat = field.category ?? "Other";
      if (!map[cat]) {
        map[cat] = [];
        order.push(cat);
      }
      map[cat].push(field);
    }
    return { order, map };
  }, [visibleFields, hasCategorized]);

  const renderField = (fieldConfig: FieldConfig) => (
    <div
      key={fieldConfig.name}
      className={
        fieldConfig.colSpan === 2 ||
        fieldConfig.type === "textarea" ||
        fieldConfig.type === "tags" ||
        fieldConfig.type === "multi-select" ||
        fieldConfig.type === "checkbox-group" ||
        fieldConfig.type === "address" ||
        fieldConfig.type === "json"
          ? "md:col-span-2"
          : ""
      }
    >
      <Controller
        name={fieldConfig.name}
        control={control}
        render={({ field }) => (
          <FormFieldComponent
            id={fieldConfig.name}
            config={fieldConfig}
            value={field.value}
            onChange={field.onChange}
            error={!!errors[fieldConfig.name]}
          />
        )}
      />
      {errors[fieldConfig.name]?.message && (
        <p className="mt-1 text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
          {errors[fieldConfig.name]?.message as string}
        </p>
      )}
      {fieldConfig.helpText && !errors[fieldConfig.name]?.message && (
        <p className="mt-1 text-xs text-muted-foreground">{fieldConfig.helpText}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit((data) => onSubmit(data as Record<string, unknown>))}
      className="space-y-5"
    >
      {hasCategorized && categories ? (
        <>
          {categories.order.map((cat, idx) => (
            <div
              key={cat}
              className="rounded-2xl border border-border/60 bg-muted/20 p-5 shadow-sm"
            >
              <div className="mb-5 flex items-center gap-2.5">
                <div
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold text-primary-foreground shadow-sm"
                  style={{ background: "var(--primary)" }}
                >
                  {idx + 1}
                </div>
                <h3 className="text-sm font-semibold text-foreground">{cat}</h3>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {categories.map[cat].map(renderField)}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleFields.map(renderField)}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="bg-red-50 px-6 font-medium text-red-600 hover:bg-red-100 hover:text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            {cancelLabel}
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-6 font-medium text-primary-foreground"
          style={{ background: "var(--primary)" }}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Check className="mr-2 h-4 w-4" />
          )}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
