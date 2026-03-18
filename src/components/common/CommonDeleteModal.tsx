import { AlertTriangle, Trash2 } from "lucide-react";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/Button";

interface CommonDeleteModalProps {
  open: boolean;
  title?: string;
  description?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function CommonDeleteModal({
  open,
  title = "Are you sure?",
  description = "This action cannot be undone. Please confirm if you want to proceed.",
  isLoading = false,
  onCancel,
  onConfirm,
}: CommonDeleteModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-5 relative">
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-[15px] leading-relaxed text-slate-500 mt-2 px-2">
            {description}
          </p>
        </div>

        <div className="flex gap-3 p-5 bg-slate-50 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            variant="destructive"
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader type="button" text="Deleting..." iconClassName="text-white" />
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}