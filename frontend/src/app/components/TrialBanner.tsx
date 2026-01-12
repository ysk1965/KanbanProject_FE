import { SubscriptionStatus, BoardTier } from '../types';
import { Button } from './ui/button';
import { Lock } from 'lucide-react';

interface TrialBannerProps {
  status: SubscriptionStatus;
  daysRemaining?: number;
  onOpenSubscription?: () => void;
  tier?: BoardTier;
}

export function TrialBanner({ status, daysRemaining = 0, onOpenSubscription, tier }: TrialBannerProps) {
  // Standard tier: 간결한 알림 배너
  if (tier === 'STANDARD') {
    return (
      <div className="bg-bridge-obsidian border-b border-white/5 px-6 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-slate-500" />
            <span className="text-sm text-slate-400">
              Standard 플랜 - Task 10개 제한, 스케줄/마일스톤 기능 잠금
            </span>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs bg-bridge-accent hover:bg-bridge-accent/90"
            onClick={onOpenSubscription}
          >
            Premium으로 업그레이드
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'ACTIVE' || tier === 'PREMIUM') return null;

  if (status === 'TRIAL') {
    return (
      <div className="bg-blue-900 border-b border-blue-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <span className="font-semibold text-white">
                무료 체험 중 (D-{daysRemaining})
              </span>
              <span className="text-blue-200 ml-2">
                체험 기간이 {daysRemaining}일 남았습니다.
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-blue-400 text-white hover:bg-blue-800"
            onClick={onOpenSubscription}
          >
            요금제 보기
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'GRACE') {
    return (
      <div className="bg-yellow-900 border-b border-yellow-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚠️</span>
            <div>
              <span className="font-semibold text-white">
                체험 기간이 종료되었습니다
              </span>
              <span className="text-yellow-200 ml-2">
                3일 내 구독하지 않으면 기능이 제한됩니다.
              </span>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-yellow-500 hover:bg-yellow-600 text-gray-900"
            onClick={onOpenSubscription}
          >
            지금 구독하기
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'SUSPENDED') {
    return (
      <div className="bg-red-900 border-b border-red-800 px-6 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <div>
              <span className="font-semibold text-white">
                이 보드는 현재 정지 상태입니다
              </span>
              <span className="text-red-200 ml-2">
                구독을 시작하면 모든 기능을 다시 사용할 수 있습니다.
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              className="bg-red-500 hover:bg-red-600"
              onClick={onOpenSubscription}
            >
              구독하기
            </Button>
            <Button variant="outline" size="sm" className="border-red-400 text-white hover:bg-red-800">
              데이터 내보내기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}