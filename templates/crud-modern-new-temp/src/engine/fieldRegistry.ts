import type { ComponentType } from "react";
import type { FieldComponentProps, FieldType } from "@/shared/components/form/form.types";

import { TextInput } from "@/components/fields/TextInput";
import { EmailInput } from "@/components/fields/EmailInput";
import { NumberInput } from "@/components/fields/NumberInput";
import { CurrencyInput } from "@/components/fields/CurrencyInput";
import { SelectInput } from "@/components/fields/SelectInput";
import { MultiSelectInput } from "@/components/fields/MultiSelectInput";
import { TextareaInput } from "@/components/fields/TextareaInput";
import { DateInput } from "@/components/fields/DateInput";
import { ToggleInput } from "@/components/fields/ToggleInput";
import { CheckboxInput } from "@/components/fields/CheckboxInput";
import { RadioInput } from "@/components/fields/RadioInput";
import { PhoneInput } from "@/components/fields/PhoneInput";
import { FileInput } from "@/components/fields/FileInput";
import { ImageInput } from "@/components/fields/ImageInput";
import { TagsInput } from "@/components/fields/TagsInput";
import { UrlInput } from "@/components/fields/UrlInput";
import { ColorInput } from "@/components/fields/ColorInput";
import { TimeInput } from "@/components/fields/TimeInput";
import { DateTimeInput } from "@/components/fields/DateTimeInput";
import { JsonInput } from "@/components/fields/JsonInput";
import { ReferenceInput } from "@/components/fields/ReferenceInput";
import { PercentageInput } from "@/components/fields/PercentageInput";
import { RatingInput } from "@/components/fields/RatingInput";

/**
 * type → component map. The form engine looks the renderer up here, so adding
 * a field type means registering one component.
 */
export const fieldRegistry: Partial<Record<FieldType, ComponentType<FieldComponentProps>>> = {
  text: TextInput,
  email: EmailInput,
  phone: PhoneInput,
  url: UrlInput,
  textarea: TextareaInput,
  number: NumberInput,
  currency: CurrencyInput,
  percentage: PercentageInput,
  rating: RatingInput,
  select: SelectInput,
  radio: RadioInput,
  color: ColorInput,
  "multi-select": MultiSelectInput,
  tags: TagsInput,
  "checkbox-group": MultiSelectInput,
  checkbox: CheckboxInput,
  toggle: ToggleInput,
  date: DateInput,
  time: TimeInput,
  datetime: DateTimeInput,
  file: FileInput,
  image: ImageInput,
  avatar: ImageInput,
  address: JsonInput,
  json: JsonInput,
  reference: ReferenceInput,
};
