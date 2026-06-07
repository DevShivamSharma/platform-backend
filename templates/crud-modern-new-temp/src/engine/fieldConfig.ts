import type { GeneratedFieldConfig } from "@/lib/config.types";
import type { FieldConfig } from "@/shared/components/form/form.types";

const SECTION_SIZE = 4;
const SECTION_NAMES = ["Basic Info", "Details", "Additional", "More", "Extra"];

export function toFormFields(fields: GeneratedFieldConfig[]): FieldConfig[] {
  return fields.map((field, index) => {
    const sectionIndex = Math.floor(index / SECTION_SIZE);
    return {
      name: field.key,
      label: field.label,
      type: field.type,
      placeholder: field.placeholder,
      required: field.required,
      helpText: field.helpText,
      colSpan: field.width === "full" ? 2 : 1,
      category: SECTION_NAMES[sectionIndex] ?? `Section ${sectionIndex + 1}`,
      options: field.options?.map((option) => ({ label: option, value: option })),
    };
  });
}
