export type FilterFieldType = "text" | "select" | "date" | "date-range";

export interface FilterFieldOption {
  label: string;
  value: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: FilterFieldType;
  placeholder?: string;
  options?: FilterFieldOption[];
  fromKey?: string;
  toKey?: string;
  className?: string;
}
