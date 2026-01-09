import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';

interface CreateBoardModalProps {
  open: boolean;
  onClose: () => void;
  onCreateBoard: (name: string, color: string) => void;
  availableColors: Array<{ name: string; value: string }>;
}

export function CreateBoardModal({
  open,
  onClose,
  onCreateBoard,
  availableColors,
}: CreateBoardModalProps) {
  const [boardName, setBoardName] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors[0].value);

  const handleCreate = () => {
    if (boardName.trim()) {
      onCreateBoard(boardName.trim(), selectedColor);
      setBoardName('');
      setSelectedColor(availableColors[0].value);
    }
  };

  const handleClose = () => {
    setBoardName('');
    setSelectedColor(availableColors[0].value);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-[#282e33] text-white border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Create board</DialogTitle>
          <DialogDescription className="text-gray-400">
            새로운 칸반보드를 생성합니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 보드 미리보기 */}
          <div className="space-y-2">
            <Label className="text-gray-300">Board preview</Label>
            <div
              className="h-28 rounded-lg flex items-center justify-center"
              style={{ background: selectedColor }}
            >
              <span className="text-white font-semibold text-base px-4 py-2 bg-black/20 rounded">
                {boardName || '보드 이름'}
              </span>
            </div>
          </div>

          {/* 보드 이름 */}
          <div className="space-y-2">
            <Label htmlFor="board-name" className="text-gray-300">
              Board name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="board-name"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="예: 프로젝트 관리"
              className="bg-[#1d2125] border-gray-600 text-white placeholder:text-gray-500 focus:border-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreate();
                }
              }}
            />
          </div>

          {/* 색상 선택 */}
          <div className="space-y-2">
            <Label className="text-gray-300">Background color</Label>
            <div className="grid grid-cols-3 gap-2">
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={`h-12 rounded-lg transition-all ${
                    selectedColor === color.value
                      ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#282e33] scale-105'
                      : 'hover:scale-105'
                  }`}
                  style={{ background: color.value }}
                >
                  <span className="sr-only">{color.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-600 text-gray-300 hover:bg-[#1d2125] hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!boardName.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}