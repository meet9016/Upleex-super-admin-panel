import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import Loader from "@/components/common/Loader";
import { Button } from "@/components/ui/Button";

interface PromptModalProps {
  open: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  required?: boolean;
  multiline?: boolean;
  onCancel: () => void;
  onConfirm: (value: string) => void;
}

export default function PromptModal({
  open,
  title,
  description,
  placeholder = "Enter text here...",
  defaultValue = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  required = false,
  multiline = false,
  onCancel,
  onConfirm,
}: PromptModalProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
    }
  }, [open, defaultValue]);

  const handleConfirm = () => {
    if (required && !value.trim()) {
      alert("Please enter a value");
      return;
    }
    onConfirm(value);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">
              {title}
            </h3>
          </div>

          {description && (
            <p className="text-[14px] leading-relaxed text-slate-500 mb-4 px-1 whitespace-pre-wrap">
              {description}
            </p>
          )}

          {/* Input Field */}
          {multiline ? (
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={4}
              disabled={isLoading}
            />
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
              autoFocus
            />
          )}
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
            className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
            onClick={handleConfirm}
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
