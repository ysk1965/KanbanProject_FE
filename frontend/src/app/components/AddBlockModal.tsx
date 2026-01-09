import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface AddBlockModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
  isEdit?: boolean;
  initialName?: string;
  initialColor?: string;
}

const COLORS = [
  { name: '빨강', value: '#EF4444' },
  { name: '주황', value: '#F59E0B' },
  { name: '노랑', value: '#EAB308' },
  { name: '초록', value: '#10B981' },
  { name: '파랑', value: '#3B82F6' },
  { name: '보라', value: '#8B5CF6' },
  { name: '회색', value: '#6B7280' },
];

export function AddBlockModal({
  open,
  onClose,
  onAdd,
  isEdit = false,
  initialName = '',
  initialColor = '#3B82F6',
}: AddBlockModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  const handleSubmit = () => {
    if (name.trim()) {
      onAdd(name.trim(), selectedColor);
      setName('');
      setSelectedColor('#3B82F6');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? '블록 수정' : '새 블록 추가'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="block-name">이름</Label>
            <Input
              id="block-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: In Progress"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>색상</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-10 h-10 rounded-lg border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-gray-900 scale-110'
                      : 'border-gray-200'
                  }`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => setSelectedColor(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              {isEdit ? '수정' : '추가'}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
