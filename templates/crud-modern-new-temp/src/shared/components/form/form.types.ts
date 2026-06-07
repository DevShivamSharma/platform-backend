import type { z } from "zod/v4";

/** All field types supported by the form engine (15 essential types). */
export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "url"
  | "textarea"
  | "number"
  | "currency"
  | "percentage"
  | "rating"
  | "select"
  | "radio"
  | "color"
  | "multi-select"
  | "tags"
  | "checkbox-group"
  | "checkbox"
  | "toggle"
  | "date"
  | "time"
  | "datetime"
  | "file"
  | "image"
  | "avatar"
  | "address"
  | "json"
  | "reference"
  | "password";

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: FieldOption[];
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  colSpan?: 1 | 2;
  category?: string;
  rows?: number;
  displayFormat?: string;
  helpText?: string;
  dependsOn?: {
    field: string;
    value: string;
  };
}

/** Uniform props every field component receives. */
export interface FieldComponentProps {
  id: string;
  value: unknown;
  onChange: (value: unknown) => void;
  config: FieldConfig;
  error?: boolean;
}

export interface FormBuilderProps<T extends z.ZodType> {
  fields: FieldConfig[];
  schema: T;
  defaultValues?: Partial<z.infer<T>>;
  onSubmit: (data: z.infer<T>) => void | Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
}
