import type { FilterField, FilterFieldOption } from "./filter-bar.types";

/**
 * How a filter is shown in the compact bar:
 * - inline: control is always visible (e.g. date range input)
 * - chip: "Add filter" button; when set, show as chip/pill with clear
 */
export type GlobalFilterVariant = "inline" | "chip";

export interface GlobalFilterField extends FilterField {
  /** Inline = always show control in bar; chip = add-button then pill when set. Default: "chip" for select/text, "inline" for date-range. */
  variant?: GlobalFilterVariant;
  /** API param name if different from key (for apiMapping). */
  apiKey?: string;
  /** For select: allow multiple values (stored as CSV). Renders as pill toggles in popover. */
  multi?: boolean;
}

export interface GlobalFilterConfig<F extends Record<string, string> = Record<string, string>> {
  filterFields: GlobalFilterField[];
  defaultValues: F;
  /** Map internal key -> API param name when they differ. */
  apiMapping?: Record<string, string>;
}

export type { FilterFieldOption };
