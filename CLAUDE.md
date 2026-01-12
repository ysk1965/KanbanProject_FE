# BRIDGE 프로젝트 가이드

이 문서는 Claude Code가 BRIDGE 프로젝트 개발 시 참조하는 가이드입니다.

## 프로젝트 구조

```
frontend/
├── src/app/
│   ├── components/       # UI 컴포넌트
│   │   ├── landing/      # 랜딩 페이지 컴포넌트
│   │   └── ui/           # 기본 UI 컴포넌트 (shadcn)
│   ├── pages/            # 페이지 컴포넌트
│   ├── contexts/         # React Context
│   ├── utils/            # API, 서비스, 유틸리티
│   ├── types/            # TypeScript 타입 정의
│   └── styles/           # CSS 스타일
backend/
├── src/main/java/com/kanban/
│   ├── domain/           # 도메인별 패키지 (board, task, user 등)
│   └── global/           # 공통 설정, 예외 처리
```

---

## BRIDGE 디자인 시스템

### 컬러 팔레트

| 이름 | 변수 | HEX | 용도 |
|------|------|-----|------|
| Bridge Dark | `bridge-dark` | `#0A0E17` | 메인 배경 |
| Bridge Obsidian | `bridge-obsidian` | `#0F1419` | 카드/헤더 배경 |
| Bridge Accent | `bridge-accent` | `#6366F1` | 주요 액센트 (인디고) |
| Bridge Secondary | `bridge-secondary` | `#2DD4BF` | 보조 액센트 (틸) |

#### 사용 예시
```tsx
// 배경
<div className="bg-bridge-dark" />           // 메인 배경
<div className="bg-bridge-obsidian" />       // 카드/섹션 배경

// 텍스트
<span className="text-bridge-accent" />      // 강조 텍스트
<span className="text-bridge-secondary" />   // 보조 강조

// 버튼
<button className="bg-bridge-accent hover:bg-bridge-accent/90" />

// 테두리
<div className="border border-white/10" />   // 기본 테두리
<div className="border border-bridge-accent/50" /> // 강조 테두리
```

### 타이포그래피

- **헤딩**: `font-serif font-bold tracking-tight`
- **본문**: `font-light` 또는 기본
- **라벨**: `text-[11px] font-bold uppercase tracking-widest text-slate-400`
- **작은 텍스트**: `text-[10px] tracking-[0.3em] uppercase`

```tsx
// 헤딩
<h1 className="font-serif text-4xl font-bold tracking-tight text-white">제목</h1>

// 라벨
<label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">라벨</label>

// 본문
<p className="text-slate-400 font-light leading-relaxed">본문 텍스트</p>
```

### 컴포넌트 스타일

#### 카드
```tsx
<div className="bg-bridge-obsidian rounded-2xl border border-white/5 p-6">
  {/* 카드 내용 */}
</div>
```

#### 버튼

**Primary 버튼**
```tsx
<button className="px-6 py-3 bg-bridge-accent text-white rounded-xl font-bold
  hover:bg-bridge-accent/90 hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all">
  버튼
</button>
```

**Secondary 버튼**
```tsx
<button className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl
  hover:bg-white/10 transition-all">
  버튼
</button>
```

**Ghost 버튼**
```tsx
<button className="text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
  버튼
</button>
```

#### 입력 필드
```tsx
<input className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4
  text-white placeholder-slate-600
  focus:outline-none focus:ring-2 focus:ring-bridge-accent/50 focus:border-bridge-accent
  transition-all" />
```

#### 모달/다이얼로그
```tsx
<div className="bg-bridge-obsidian rounded-2xl border border-white/10 p-6 shadow-2xl">
  {/* 모달 내용 */}
</div>
```

### 레이아웃 패턴

#### Glass Morphism 헤더
```tsx
<header className="bg-bridge-obsidian border-b border-white/5 glass">
  {/* glass 클래스는 backdrop-blur 효과 적용 */}
</header>
```

#### 섹션 구분
```tsx
<section className="py-20 bg-bridge-dark border-y border-white/5">
  {/* 섹션 내용 */}
</section>
```

### 애니메이션

#### Fade In Up
```tsx
<div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
  {/* 애니메이션 적용 요소 */}
</div>
```

#### Framer Motion 사용
```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  {/* 애니메이션 요소 */}
</motion.div>
```

### 아이콘

Lucide React 사용:
```tsx
import { Plus, Users, Settings } from 'lucide-react';

<Plus className="h-4 w-4" />
```

### 반응형 디자인

```tsx
// 모바일 우선 접근
<div className="p-4 md:p-8 lg:p-12">
  <h1 className="text-2xl md:text-4xl lg:text-6xl">반응형 제목</h1>
</div>

// 그리드
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 그리드 아이템 */}
</div>
```

---

## 개발 가이드라인

### 새 컴포넌트 작성 시

1. **Bridge 컬러 사용**: `#1d2125`, `#282e33` 대신 `bridge-dark`, `bridge-obsidian` 사용
2. **테두리**: `border-gray-700` 대신 `border-white/10` 또는 `border-white/5`
3. **텍스트**: `text-gray-400` 대신 `text-slate-400`
4. **호버 효과**: `hover:bg-[#3a4149]` 대신 `hover:bg-white/5`
5. **라운드**: 대부분 `rounded-xl` 또는 `rounded-2xl` 사용
6. **그림자**: `shadow-lg` 또는 accent 기반 `shadow-[0_0_30px_rgba(99,102,241,0.3)]`

### 참조 컴포넌트

디자인 참조가 필요할 때 다음 파일들을 확인:
- `frontend/src/app/components/landing/LandingPage.tsx` - 전체 디자인 시스템 적용 예시
- `frontend/src/app/components/landing/Diagrams.tsx` - 인터랙티브 컴포넌트 예시
- `frontend/src/app/components/LoginPage.tsx` - 폼 디자인 예시
- `frontend/src/app/components/BoardListPage.tsx` - 카드 그리드 예시
- `frontend/reference/` - 원본 디자인 레퍼런스

### CSS 변수 위치

모든 Bridge 테마 변수는 `frontend/src/styles/theme.css`에 정의되어 있습니다.

---

## API 규칙

- 백엔드: `http://localhost:8080/api/v1/`
- 프론트엔드 서비스: `frontend/src/app/utils/services.ts`
- API 호출: `frontend/src/app/utils/api.ts`

## 테스트

```bash
# 프론트엔드 빌드
cd frontend && npm run build

# 백엔드 빌드
cd backend && ./gradlew build
```
