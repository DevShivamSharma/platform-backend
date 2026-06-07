import { toast } from "sonner";

export const toastr = {
  success(message: string): void {
    toast.success(message);
  },
  error(message: string, title?: string): void {
    if (title) {
      toast.error(message, { description: title });
      return;
    }
    toast.error(message);
  },
};
