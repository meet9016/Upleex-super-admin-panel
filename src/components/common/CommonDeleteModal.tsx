import { Loader2 } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
            <svg
              className="w-7 h-7 text-red-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M5.455 19h13.09c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.723 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h3 className="text-lg font-semibold text-gray-900">
            {title}
          </h3>

          <p className="text-sm text-gray-500 mt-2">
            {description}
          </p>
        </div>

        <div className="flex gap-3 p-4 bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl"
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Yes, Delete"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}