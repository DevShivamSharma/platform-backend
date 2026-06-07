import { z } from "zod/v4";
import type { GeneratedFieldConfig } from "./config.types";

function optionalStringSchema(required: boolean, label: string) {
  const schema = z.string();
  return required ? schema.min(1, `${label} is required`) : schema.optional().or(z.literal(""));
}

function optionalNumberSchema(required: boolean, label: string) {
  const numberSchema = z.preprocess(
    (value) => (value === "" || value == null ? undefined : Number(value)),
    required ? z.number(`${label} is required`) : z.number().optional()
  );
  return required ? numberSchema : numberSchema.optional();
}

export function buildSchema(fields: GeneratedFieldConfig[]): z.ZodType<Record<string, unknown>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of fields) {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case "email":
        schema = field.required
          ? z.string().min(1, `${field.label} is required`).email("Enter a valid email")
          : z.string().email("Enter a valid email").or(z.literal("")).optional();
        break;
      case "url":
        schema = field.required
          ? z.string().min(1, `${field.label} is required`).url("Enter a valid URL")
          : z.string().url("Enter a valid URL").or(z.literal("")).optional();
        break;
      case "number":
      case "currency":
      case "percentage":
      case "rating":
        schema = optionalNumberSchema(field.required, field.label);
        break;
      case "checkbox":
      case "toggle":
        schema = z.boolean().optional().default(false);
        break;
      case "multi-select":
      case "tags":
      case "checkbox-group":
        schema = field.required
          ? z.array(z.string()).min(1, `${field.label} is required`)
          : z.array(z.string()).optional().default([]);
        break;
      case "address":
      case "json": {
        const jsonSchema = z.string().refine(
          (value: string) => {
            if (!value) return true;
            try {
              JSON.parse(String(value));
              return true;
            } catch {
              return false;
            }
          },
          { message: "Enter valid JSON" }
        );
        schema = field.required
          ? jsonSchema.min(1, `${field.label} is required`)
          : jsonSchema.optional().or(z.literal(""));
        break;
      }
      default:
        schema = optionalStringSchema(field.required, field.label);
    }

    shape[field.key] = schema;
  }

  return z.object(shape) as unknown as z.ZodType<Record<string, unknown>>;
}

export function buildDefaults(fields: GeneratedFieldConfig[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of fields) {
    switch (field.type) {
      case "checkbox":
      case "toggle":
        out[field.key] = false;
        break;
      case "multi-select":
      case "tags":
      case "checkbox-group":
        out[field.key] = [];
        break;
      default:
        out[field.key] = "";
    }
  }
  return out;
}

export function buildPayload(
  fields: GeneratedFieldConfig[],
  data: Record<string, unknown>
): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const value = data[field.key];
    if (value === "" || value == null) {
      payload[field.key] = field.type === "checkbox" || field.type === "toggle" ? false : null;
      continue;
    }

    if (field.type === "address" || field.type === "json") {
      payload[field.key] = typeof value === "string" ? JSON.parse(value) : value;
      continue;
    }

    payload[field.key] = value;
  }

  return payload;
}
