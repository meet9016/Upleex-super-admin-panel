import { AlertCircle } from "lucide-react";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/Button";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDangerous?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  isDangerous = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  if (!open) return null;

  const bgColor = isDangerous ? "bg-red-50" : "bg-blue-50";
  const iconColor = isDangerous ? "text-red-600" : "text-blue-600";
  const confirmBg = isDangerous ? "bg-red-600 hover:bg-red-700 shadow-red-200" : "bg-blue-600 hover:bg-blue-700 shadow-blue-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-5">
            <AlertCircle className={`w-6 h-6 ${iconColor}`} />
          </div>

          <h3 className="text-xl font-bold text-slate-900">
            {title}
          </h3>

          <p className="text-[15px] leading-relaxed text-slate-500 mt-2 px-2 whitespace-pre-wrap">
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
            {cancelText}
          </Button>

          <Button
            className={`flex-1 rounded-xl ${confirmBg} text-white shadow-sm`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader type="button" text="Processing..." iconClassName="text-white" />
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
