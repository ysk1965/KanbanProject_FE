import { useState, useRef, useEffect } from 'react';
import { User, CreditCard, LogOut, Settings as SettingsIcon, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  onOpenSubscription: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export function UserMenu({ user, onOpenSubscription, onOpenSettings, onLogout }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      {/* 프로필 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#3a4149] transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
            {user.name[0].toUpperCase()}
          </div>
        )}
        <span className="text-sm text-gray-300 hidden md:block">{user.name}</span>
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-[#282e33] rounded-lg shadow-xl border border-gray-700 py-2 z-50">
          {/* 사용자 정보 */}
          <div className="px-4 py-3 border-b border-gray-700">
            <div className="font-medium text-white">{user.name}</div>
            <div className="text-sm text-gray-400">{user.email}</div>
          </div>

          {/* 메뉴 아이템 */}
          <div className="py-2">
            <button
              onClick={() => {
                onOpenSettings();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#3a4149] transition-colors text-gray-300 hover:text-white"
            >
              <User className="h-4 w-4" />
              <span>내 정보</span>
            </button>

            <button
              onClick={() => {
                onOpenSubscription();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#3a4149] transition-colors text-gray-300 hover:text-white"
            >
              <CreditCard className="h-4 w-4" />
              <span>구독 관리</span>
            </button>
          </div>

          {/* 로그아웃 */}
          <div className="border-t border-gray-700 pt-2">
            <button
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-red-600/20 transition-colors text-red-400 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
