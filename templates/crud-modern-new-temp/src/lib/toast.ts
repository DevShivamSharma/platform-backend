import { toast } from "sonner";

/**
 * Thin wrapper over sonner for CRUD feedback. The Toaster itself lives in
 * providers.tsx (themed, slide-in). These helpers keep messaging consistent.
 */
export const notify = {
  success(message: string) {
    toast.success(message);
  },
  error(message: string) {
    toast.error(message);
  },
  info(message: string) {
    toast.info(message);
  },
  created(label: string) {
    toast.success(`${label} created successfully ✓`);
  },
  updated(label: string) {
    toast.success(`${label} updated successfully ✓`);
  },
  deleted(label: string) {
    toast.success(`${label} deleted`);
  },
};
