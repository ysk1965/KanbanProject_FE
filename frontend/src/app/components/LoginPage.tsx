import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, User, Users, ArrowLeft, Github, Layers, Shield, Zap } from 'lucide-react';

interface InviteInfo {
  boardName: string;
  role: string;
  inviterName?: string;
}

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onSignup: (email: string, password: string, name: string) => Promise<void>;
  onGoogleLogin?: (idToken: string) => Promise<void>;
  onBack?: () => void;
  inviteInfo?: InviteInfo | null;
}

export function LoginPage({ onLogin, onSignup, onGoogleLogin, onBack, inviteInfo }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(inviteInfo ? 'signup' : 'login');
  const [email, setEmail] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, name);
      }
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Admin (관리자)',
      MEMBER: 'Member (멤버)',
      VIEWER: 'Observer (읽기 전용)',
    };
    return roleMap[role] || role;
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-bridge-dark text-white">
      {/* 왼쪽: 브랜드 섹션 (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 relative flex-col justify-center p-20 bg-gradient-to-br from-bridge-accent/20 to-bridge-obsidian overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-14 h-14 bg-bridge-accent rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl shadow-[0_0_25px_rgba(99,102,241,0.5)]">B</div>
            <span className="font-serif font-bold text-4xl tracking-tight text-white">BRIDGE</span>
          </div>
          <p className="text-xl text-slate-400 leading-relaxed mb-12 font-light">
            "복잡한 협업을 단순한 흐름으로.<br />
            팀원들의 시간을 가장 가치 있게 연결합니다."
          </p>
          <div className="space-y-6">
            {[
              { icon: <Layers className="w-5 h-5" />, text: "Feature 중심의 명확한 구조" },
              { icon: <Shield className="w-5 h-5" />, text: "역할 기반의 철저한 보안" },
              { icon: <Zap className="w-5 h-5" />, text: "실시간 협업 및 일정 관리" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 text-slate-400">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10">{item.icon}</div>
                <span className="font-light">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오른쪽: 로그인 폼 */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={handleBack}
          className="absolute top-8 left-8 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* 초대 배너 */}
          {inviteInfo && (
            <div className="bg-gradient-to-r from-bridge-accent/20 to-bridge-secondary/20 border border-bridge-accent/30 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-bridge-accent/20 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-bridge-accent" />
                </div>
                <div>
                  <p className="text-sm text-bridge-secondary">보드 초대</p>
                  <p className="text-white font-semibold">{inviteInfo.boardName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">참여 역할:</span>
                <span className="px-2 py-0.5 bg-bridge-accent/20 text-bridge-secondary rounded text-xs">
                  {getRoleDisplay(inviteInfo.role)}
                </span>
              </div>
            </div>
          )}

          {/* 헤더 */}
          <div className="text-center">
            <h3 className="text-4xl font-serif font-bold mb-3 tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h3>
            <p className="text-slate-400 font-light">
              {inviteInfo
                ? '계정을 만들고 팀에 합류하세요'
                : mode === 'login'
                ? 'BRIDGE 계정으로 로그인을 진행해주세요'
                : 'BRIDGE 계정을 생성해주세요'}
            </p>
          </div>

          {/* 소셜 로그인 버튼 */}
          <div className="space-y-3">
            {onGoogleLogin ? (
              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={async (response) => {
                    if (response.credential) {
                      setIsGoogleLoading(true);
                      setError('');
                      try {
                        await onGoogleLogin(response.credential);
                      } catch (err: any) {
                        setError(err.message || 'Google 로그인에 실패했습니다.');
                      } finally {
                        setIsGoogleLoading(false);
                      }
                    }
                  }}
                  onError={() => {
                    setError('Google 로그인에 실패했습니다.');
                  }}
                  theme="filled_black"
                  text="continue_with"
                  locale="ko"
                  width="400"
                />
              </div>
            ) : (
              <button
                type="button"
                className="w-full py-3 px-4 bg-white text-bridge-dark rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-slate-100 transition-all"
                disabled
              >
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
                  className="w-5 h-5"
                  alt="google"
                />
                Google로 계속하기
              </button>
            )}
            <button
              type="button"
              className="w-full py-3 px-4 bg-white/5 border border-white/10 text-white rounded-xl font-medium flex items-center justify-center gap-3 hover:bg-white/10 transition-all disabled:opacity-50"
              disabled
            >
              <Github className="w-5 h-5" />
              GitHub로 계속하기
            </button>
          </div>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.3em] font-bold">
              <span className="bg-bridge-dark px-4 text-slate-500">
                또는 이메일로 {mode === 'login' ? '로그인' : '가입'}
              </span>
            </div>
          </div>

          {/* 이메일 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">이름</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-bridge-accent transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-bridge-accent/50 focus:border-bridge-accent transition-all placeholder-slate-600"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">이메일</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-bridge-accent transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-bridge-accent/50 focus:border-bridge-accent transition-all placeholder-slate-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest ml-1">비밀번호</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-bridge-accent transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-bridge-accent/50 focus:border-bridge-accent transition-all placeholder-slate-600"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className={`w-full py-4 text-white rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                inviteInfo && mode === 'signup'
                  ? 'bg-gradient-to-r from-bridge-accent to-bridge-secondary hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                  : 'bg-bridge-accent hover:bg-bridge-accent/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]'
              }`}
            >
              {isLoading
                ? '처리중...'
                : mode === 'login'
                ? inviteInfo
                  ? '로그인하고 보드 참여하기'
                  : '로그인'
                : inviteInfo
                ? '가입하고 보드 참여하기'
                : '회원가입'}
            </button>
          </form>

          {/* 모드 전환 */}
          <p className="text-center text-slate-500 text-sm">
            {mode === 'login' ? (
              <>
                아직 계정이 없으신가요?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-bridge-secondary hover:underline font-medium"
                >
                  회원가입
                </button>
              </>
            ) : (
              <>
                이미 계정이 있으신가요?{' '}
                <button
                  onClick={() => setMode('login')}
                  className="text-bridge-secondary hover:underline font-medium"
                >
                  로그인
                </button>
              </>
            )}
          </p>

          {/* 하단 안내 */}
          <p className="text-center text-[11px] text-slate-600 tracking-wide">
            {inviteInfo
              ? '초대받은 보드에서 바로 협업을 시작하세요!'
              : '7일 무료 체험 후 유료 전환됩니다.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
