import React from "react";
import { Edit, Trash2, History } from "lucide-react";

type ActionButtonsProps = {
  onEdit?: () => void;
  onDelete?: () => void;
  onHistory?: () => void;
  showEdit?: boolean;
  showDelete?: boolean;
  showHistory?: boolean;
};

export default function ActionButtons({
  onEdit,
  onDelete,
  onHistory,
  showEdit = true,
  showDelete = true,
  showHistory = false,
}: ActionButtonsProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 h-full">
      {showEdit && onEdit && (
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-md text-blue-500 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition-all duration-300 group shadow-sm"
          title="Edit"
        >
          <Edit className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      {showDelete && onDelete && (
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-md text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 transition-all duration-300 group shadow-sm"
          title="Delete"
        >
          <Trash2 className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
      {showHistory && onHistory && (
        <button
          onClick={onHistory}
          className="w-8 h-8 flex items-center justify-center rounded-md text-purple-500 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 transition-all duration-300 group shadow-sm"
          title="History"
        >
          <History className="w-[1.05rem] h-[1.05rem] group-hover:scale-110 transition-transform duration-300" />
        </button>
      )}
    </div>
  );
}
