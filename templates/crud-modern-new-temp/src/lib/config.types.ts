export type CrudFieldType =
  | "text"
  | "password"
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
  | "reference";

export interface ThemeConfig {
  primary: string;
  primaryHover?: string;
  primaryLight?: string;
  accent?: string;
}

export interface LoginFeatureConfig {
  title: string;
  description: string;
  icon: string;
}

export interface LoginPageConfig {
  portalName: string;
  badge: string;
  headline: string;
  highlightText?: string;
  description: string;
  features: LoginFeatureConfig[];
}

export interface RouteConfig {
  loginPath: string;
  appBasePath: string;
  dashboardPath: string;
  profilePath: string;
}

export type DashboardWidgetType =
  | "module-counts"
  | "currency-sum"
  | "status-breakdown"
  | "created-trend";

export interface DashboardConfig {
  enabled: boolean;
  label: string;
  icon: string;
  title: string;
  description: string;
  widgets: DashboardWidgetType[];
}

export interface CompanyConfig {
  name: string;
  website?: string;
  address?: string;
}

export interface SupportConfig {
  email?: string;
  phone?: string;
  helpUrl?: string;
}

export interface FooterConfig {
  text?: string;
}

export interface FeatureFlags {
  profile?: boolean;
  signup?: boolean;
}

export interface ModulePermissions {
  read: string;
  write: string;
  delete: string;
}

export interface GeneratedFieldConfig {
  key: string;
  label: string;
  type: CrudFieldType;
  required: boolean;
  options?: string[];
  width?: "full" | "half" | "third";
  placeholder?: string;
  helpText?: string;
}

export interface TableFeatures {
  sort: boolean;
  filter: boolean;
  search: boolean;
  pagination: boolean;
  export?: boolean;
}

export interface GeneratedModule {
  id: string;
  tableName: string;
  singularName: string;
  pluralName: string;
  icon: string;
  fields: GeneratedFieldConfig[];
  listColumns: string[];
  tableFeatures: TableFeatures;
  permissions: ModulePermissions;
}

export interface PortalConfig {
  portalName: string;
  appName: string;
  industry: string;
  logo?: string;
  logoInitials: string;
  theme: ThemeConfig;
  loginPage: LoginPageConfig;
  routes: RouteConfig;
  dashboard: DashboardConfig;
  footer?: FooterConfig;
  company: CompanyConfig;
  support: SupportConfig;
  featureFlags: FeatureFlags;
  generatedModules: GeneratedModule[];
}
