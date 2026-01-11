import { X, Plus, Layers } from 'lucide-react';
import { Clock } from 'lucide-react';

interface ActionChoiceModalProps {
  startTime: string;
  endTime: string;
  onCreateNew: () => void;
  onConnectExisting: () => void;
  onClose: () => void;
}

export function ActionChoiceModal({
  startTime,
  endTime,
  onCreateNew,
  onConnectExisting,
  onClose,
}: ActionChoiceModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[400px] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Action Choice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Time Display */}
        <div className="px-6 pb-4">
          <div className="bg-indigo-50 rounded-lg px-4 py-3 flex items-center gap-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <span className="text-indigo-700 font-medium">
              {startTime} - {endTime}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="px-6 pb-6 space-y-3">
          {/* Create New */}
          <button
            onClick={onCreateNew}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
              <Plus className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Create New Checklist Item</div>
              <div className="text-sm text-gray-500">Add a new task to this time slot</div>
            </div>
          </button>

          {/* Connect Existing */}
          <button
            onClick={onConnectExisting}
            className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Layers className="h-6 w-6 text-gray-600 group-hover:text-indigo-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900">Connect Existing Item</div>
              <div className="text-sm text-gray-500">Link a task you already created</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
