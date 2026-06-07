import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle } from "lucide-react";
import type { ConfirmDialogProps } from "./confirm-dialog.types";

export function ConfirmDialog({
  open,
  onOpenChange,
  title = "Are you sure?",
  description = "You won't be able to revert this!",
  confirmText = "DELETE",
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  const [typed, setTyped] = useState("");
  const isMatch = typed === confirmText;

  const handleConfirm = async () => {
    if (!isMatch) return;
    await onConfirm();
    setTyped("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) setTyped("");
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="p-0 gap-0 rounded-2xl overflow-hidden [&>button.absolute]:hidden bg-card"
        style={{ maxWidth: 380 }}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>

        <div className="flex flex-col items-center pt-8 pb-6 px-6">
          {/* Red circle with exclamation icon */}
          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center mb-6 shadow-lg">
            <AlertCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-foreground mb-3">Are you sure?</h2>

          {/* Description */}
          <p className="text-muted-foreground text-center text-sm leading-relaxed mb-6">
            {description}
            <br />
            Please type <span className="font-bold text-orange-500">{confirmText}</span> below
            <br />
            to delete the record.
          </p>

          {/* Input */}
          <div className="w-full mb-4">
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmText}
              autoComplete="off"
              className="text-center h-11"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={!isMatch || isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Yes, Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
