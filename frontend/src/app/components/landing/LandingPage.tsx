import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeroScene } from './BridgeScene';
import { KanbanDiagram, GanttDiagram, DailyScheduleDiagram, PriceComparisonDiagram } from './Diagrams';
import { motion } from 'framer-motion';
import { ArrowDown, Menu, X, Layers, Layout, Users, Zap, CheckCircle, Calendar, Clock } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: React.ElementType, title: string, desc: string, delay: string }) => (
  <div className="flex flex-col p-8 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl hover:bg-white/10 transition-all duration-500 animate-fade-in-up" style={{ animationDelay: delay }}>
    <div className="w-14 h-14 bg-bridge-accent/20 rounded-2xl flex items-center justify-center text-bridge-accent mb-6 border border-white/10 shadow-inner">
      <Icon size={28} />
    </div>
    <h3 className="font-serif text-2xl text-white mb-4 tracking-tight">{title}</h3>
    <p className="text-slate-400 text-sm leading-relaxed font-light">{desc}</p>
  </div>
);

const AnimatedTitle = ({ text }: { text: string }) => {
  const letters = Array.from(text);
  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 80,
      },
    },
    hidden: {
      opacity: 0,
      y: 60,
      filter: "blur(15px)",
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 80,
      },
    },
  };

  return (
    <motion.div
      style={{ overflow: "hidden", display: "flex", justifyContent: "center" }}
      variants={container}
      initial="hidden"
      animate="visible"
      className="font-serif text-6xl md:text-8xl lg:text-[12rem] font-bold leading-[0.8] mb-8 drop-shadow-[0_0_20px_rgba(99,102,241,0.3)]"
    >
      {letters.map((letter, index) => (
        <motion.span key={index} variants={child} className="text-shimmer inline-block">
          {letter}
        </motion.span>
      ))}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-bridge-dark text-slate-200 selection:bg-bridge-accent selection:text-white font-sans overflow-x-hidden">

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${scrolled ? 'glass border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
        <div className="container mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-11 h-11 bg-bridge-accent rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-[0_0_25px_rgba(99,102,241,0.5)] group-hover:rotate-6 transition-all duration-500">B</div>
            <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover:text-bridge-secondary transition-colors duration-500">BRIDGE</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
            <a href="#workflow" onClick={scrollToSection('workflow')} className="hover:text-bridge-secondary transition-all duration-300">Workflow</a>
            <a href="#scheduling" onClick={scrollToSection('scheduling')} className="hover:text-bridge-secondary transition-all duration-300">Scheduling</a>
            <a href="#pricing" onClick={scrollToSection('pricing')} className="hover:text-bridge-secondary transition-all duration-300">Pricing</a>
            <button onClick={handleGetStarted} className="px-7 py-3 bg-white text-bridge-dark rounded-full hover:bg-bridge-secondary hover:text-white transition-all duration-500 font-bold tracking-widest text-[10px] shadow-2xl">Get Started</button>
          </div>

          <button className="md:hidden text-white p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="fixed inset-0 z-40 bg-bridge-obsidian/95 backdrop-blur-2xl flex flex-col items-center justify-center gap-12 text-2xl font-serif text-white"
        >
          <a href="#workflow" onClick={scrollToSection('workflow')} className="uppercase font-bold tracking-[0.25em] text-slate-400">Workflow</a>
          <a href="#scheduling" onClick={scrollToSection('scheduling')} className="uppercase font-bold tracking-[0.25em] text-slate-400">Scheduling</a>
          <a href="#pricing" onClick={scrollToSection('pricing')} className="uppercase font-bold tracking-[0.25em] text-slate-400">Pricing</a>
          <button onClick={handleGetStarted} className="px-10 py-5 bg-bridge-accent text-white rounded-full shadow-2xl uppercase font-bold tracking-widest text-sm">Start for Free</button>
        </motion.div>
      )}

      {/* Hero Section */}
      <header className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <HeroScene />
        <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(10,14,23,0)_0%,rgba(10,14,23,0.6)_60%,#0A0E17_100%)]" />

        <div className="relative z-10 container mx-auto px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="inline-block mb-10 px-5 py-2 border border-bridge-accent/40 text-bridge-secondary text-[11px] font-bold tracking-[0.45em] uppercase rounded-full bg-bridge-accent/10 backdrop-blur-md shadow-lg"
          >
            Digital Connectivity for Global Teams
          </motion.div>

          <AnimatedTitle text="BRIDGE" />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 1.2 }}
            className="max-w-3xl mx-auto text-xl md:text-2xl text-slate-400 font-light leading-relaxed mb-16"
          >
            복잡한 협업을 단순한 흐름으로.<br/>
            팀원들의 시간을 가장 가치 있게 연결합니다.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7 }}
            className="flex flex-col md:flex-row justify-center gap-6 mb-20"
          >
            <button onClick={handleGetStarted} className="px-14 py-5 bg-bridge-accent text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:bg-bridge-accent/90 transition-all transform hover:-translate-y-1.5 duration-300">Unite Your Team</button>
            <button className="px-14 py-5 bg-white/5 border border-white/10 text-white rounded-full font-bold uppercase tracking-widest text-xs shadow-xl backdrop-blur-md hover:bg-white/10 transition-all transform hover:-translate-y-1 duration-300">Watch the Journey</button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="flex justify-center"
          >
             <a href="#intro" onClick={scrollToSection('intro')} className="group flex flex-col items-center gap-4 text-[10px] font-bold tracking-[0.4em] text-slate-500 hover:text-bridge-secondary transition-all duration-500 uppercase">
                <span>Start Exploring</span>
                <span className="p-4 border border-white/10 rounded-full group-hover:border-bridge-secondary group-hover:bg-bridge-secondary/5 transition-all duration-500">
                    <ArrowDown size={16} />
                </span>
             </a>
          </motion.div>
        </div>
      </header>

      <main>
        {/* Intro Section */}
        <section id="intro" className="py-48 bg-bridge-obsidian/50 border-y border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-bridge-accent/5 blur-[120px] rounded-full -mr-48 -mt-48" />
          <div className="container mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-12 gap-24 items-center">
            <div className="md:col-span-5">
              <div className="inline-block mb-6 text-xs font-bold tracking-[0.4em] text-bridge-accent uppercase">Philosophy</div>
              <h2 className="font-serif text-4xl md:text-7xl mb-12 leading-tight text-white">업무의 조각들을<br/>완벽한 선으로 잇다</h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-12 font-light">
                우리는 업무를 관리하는 것이 아니라 흐름을 만드는 데 집중합니다. <br/>
                BRIDGE는 가장 단순한 방식으로 팀의 가장 큰 잠재력을 이끌어냅니다.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-slate-300 uppercase tracking-widest shadow-sm">Seamless Flow</div>
                <div className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-full text-[11px] font-bold text-slate-300 uppercase tracking-widest shadow-sm">Live Synergy</div>
              </div>
            </div>
            <div className="md:col-span-7">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FeatureCard icon={Layers} title="3 고정 블록" desc="Feature, Task, Done. 업무의 시작과 끝을 명확히 정의하는 고정된 구조를 제공합니다." delay="0s" />
                <FeatureCard icon={Layout} title="커스텀 워크플로우" desc="팀 고유의 프로세스에 맞춰 Task와 Done 사이에 자유롭게 블록을 추가하세요." delay="0.1s" />
                <FeatureCard icon={Zap} title="자동 진행률 추적" desc="Task가 Done으로 이동하면 상위 Feature의 진행률이 실시간으로 자동 업데이트됩니다." delay="0.2s" />
                <FeatureCard icon={Users} title="역할 기반 권한" desc="Owner부터 Viewer까지, 명확한 역할 정의를 통해 효율적으로 팀을 운영하세요." delay="0.3s" />
              </div>
            </div>
          </div>
        </section>

        {/* Workflow Section */}
        <section id="workflow" className="py-48 bg-bridge-dark relative">
          <div className="container mx-auto px-8">
            <div className="max-w-4xl mx-auto text-center mb-32">
              <h2 className="font-serif text-4xl md:text-8xl mb-10 text-white tracking-tight">Visual Connectivity</h2>
              <p className="text-xl text-slate-500 leading-relaxed font-light">
                흩어져 있는 태스크들이 하나의 목표를 향해 정렬되는 과정. <br/>
                BRIDGE의 지능형 칸반 시스템이 이를 현실로 만듭니다.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
              <div className="order-2 lg:order-1 relative">
                <div className="absolute -inset-10 bg-bridge-accent/5 blur-[100px] rounded-full" />
                <KanbanDiagram />
              </div>
              <div className="order-1 lg:order-2 space-y-16">
                {[
                  { num: "01", title: "Milestone Engineering", text: "프로젝트의 큰 이정표를 설정하고, 이를 실현하기 위한 핵심 Feature들을 그룹화합니다." },
                  { num: "02", title: "Automated Tasking", text: "Feature 상세 페이지에서 서브태스크를 추가하면 칸반 보드에 자동으로 카드가 생성됩니다." },
                  { num: "03", title: "Insightful Execution", text: "모든 진행 상황은 데이터로 축적되어 팀의 생산성을 시각적으로 확인할 수 있게 해줍니다." }
                ].map((item, i) => (
                  <motion.div
                    whileHover={{ x: 10 }}
                    key={i}
                    className="flex gap-10 group cursor-default"
                  >
                    <div className="flex-shrink-0 w-20 h-20 rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center font-serif text-3xl font-bold text-bridge-accent group-hover:bg-bridge-accent group-hover:text-white transition-all duration-700 shadow-2xl">
                      {item.num}
                    </div>
                    <div>
                      <h4 className="text-3xl font-serif text-white mb-4 tracking-tight group-hover:text-bridge-secondary transition-colors duration-500">{item.title}</h4>
                      <p className="text-slate-500 leading-relaxed text-lg font-light">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scheduling Section */}
        <section id="scheduling" className="py-48 bg-bridge-obsidian border-y border-white/5">
          <div className="container mx-auto px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-28 items-center">
              <div className="lg:col-span-5">
                <div className="inline-block mb-6 text-xs font-bold tracking-[0.4em] text-bridge-secondary uppercase">Precision Controls</div>
                <h2 className="font-serif text-4xl md:text-7xl mb-12 leading-tight text-white">시간의 가치를 <br/>다시 정의하다</h2>
                <p className="text-xl text-slate-400 mb-16 leading-relaxed font-light">
                  우리는 시간이 곧 자산임을 압니다. <br/>
                  팀원들의 에너지가 가장 필요한 곳에 집중될 수 있도록 정교한 스케줄링 도구를 제공합니다.
                </p>
                <div className="space-y-8">
                  <div className="p-10 bg-bridge-dark/50 backdrop-blur-md rounded-3xl border border-white/10 flex items-start gap-8 hover:border-bridge-secondary/50 transition-all duration-500 group">
                    <Calendar className="text-bridge-accent mt-1 flex-shrink-0 group-hover:text-bridge-secondary transition-all duration-500" size={32} />
                    <div>
                      <h5 className="text-2xl font-serif text-white mb-3 tracking-tight">Weekly Roadmap</h5>
                      <p className="text-slate-500 text-base leading-relaxed font-light">Task의 기간을 직관적으로 조정하고 팀 전체의 마일스톤 로드맵을 한눈에 파악하세요.</p>
                    </div>
                  </div>
                  <div className="p-10 bg-bridge-dark/50 backdrop-blur-md rounded-3xl border border-white/10 flex items-start gap-8 hover:border-bridge-secondary/50 transition-all duration-500 group">
                    <Clock className="text-bridge-accent mt-1 flex-shrink-0 group-hover:text-bridge-secondary transition-all duration-500" size={32} />
                    <div>
                      <h5 className="text-2xl font-serif text-white mb-3 tracking-tight">Daily Time Pulse</h5>
                      <p className="text-slate-500 text-base leading-relaxed font-light">데일리 스케줄을 통해 업무 중복을 방지하고 개인의 몰입 시간을 완벽히 확보하세요.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-7 flex flex-col gap-12">
                <GanttDiagram />
                <DailyScheduleDiagram />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-48 bg-bridge-dark">
          <div className="container mx-auto px-8 text-center">
             <div className="max-w-4xl mx-auto mb-32">
                <h2 className="font-serif text-4xl md:text-8xl mb-10 text-white tracking-tight">Global Investment</h2>
                <p className="text-slate-500 text-xl font-light leading-relaxed">복잡한 과금 체계는 잊으세요. <br/>팀의 규모와 성장에 최적화된 가장 투명한 플랜을 제안합니다.</p>
             </div>

             {/* Price Comparison Diagram */}
             <div className="max-w-xl mx-auto mb-24">
               <PriceComparisonDiagram />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-7xl mx-auto items-end">
                <div className="p-14 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-all duration-500">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.45em] mb-8">Discovery</span>
                  <h3 className="text-6xl font-serif mb-4 text-white">Free</h3>
                  <p className="text-sm text-slate-500 mb-12">Up to 3 Users</p>
                  <ul className="text-xs space-y-7 text-slate-400 mb-14 text-left w-full border-t border-white/5 pt-12">
                    <li className="flex items-center gap-4"><CheckCircle size={18} className="text-bridge-secondary/50" /> Unified Workflow Core</li>
                    <li className="flex items-center gap-4"><CheckCircle size={18} className="text-bridge-secondary/50" /> Real-time Sync Engine</li>
                  </ul>
                  <button onClick={handleGetStarted} className="w-full py-5 border border-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">Select Plan</button>
                </div>

                <div className="p-16 bg-bridge-obsidian rounded-[3rem] border-2 border-bridge-accent/40 shadow-[0_0_80px_rgba(99,102,241,0.15)] flex flex-col items-center text-center transform scale-105 relative z-10 transition-all duration-700">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-bridge-accent text-white px-8 py-2.5 rounded-full text-[11px] font-bold tracking-[0.4em] uppercase shadow-2xl">Essential</div>
                  <h3 className="text-7xl font-serif mb-5 text-white">$24</h3>
                  <p className="text-sm text-slate-400 mb-12">4~10 Users (Annual Billing)</p>
                  <ul className="text-xs space-y-7 text-slate-300 mb-14 text-left w-full border-t border-white/10 pt-12">
                    <li className="flex items-center gap-4"><CheckCircle size={20} className="text-bridge-secondary" /> Role Orchestration</li>
                    <li className="flex items-center gap-4"><CheckCircle size={20} className="text-bridge-secondary" /> Comprehensive Temporal Views</li>
                    <li className="flex items-center gap-4"><CheckCircle size={20} className="text-bridge-secondary" /> Milestone Prediction Logic</li>
                  </ul>
                  <button onClick={handleGetStarted} className="w-full py-6 bg-bridge-accent text-white rounded-full text-[11px] font-bold uppercase tracking-widest shadow-2xl hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all duration-500">Start 7-Day Trial</button>
                </div>

                <div className="p-14 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 flex flex-col items-center text-center hover:bg-white/10 transition-all duration-500">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.45em] mb-8">Scale</span>
                  <h3 className="text-6xl font-serif mb-4 text-white">$55</h3>
                  <p className="text-sm text-slate-500 mb-12">11~25 Users (Annual)</p>
                  <ul className="text-xs space-y-7 text-slate-400 mb-14 text-left w-full border-t border-white/5 pt-12">
                    <li className="flex items-center gap-4"><CheckCircle size={18} className="text-bridge-secondary/50" /> Advanced Insight Engine</li>
                    <li className="flex items-center gap-4"><CheckCircle size={18} className="text-bridge-secondary/50" /> Custom Visual Identity</li>
                  </ul>
                  <button className="w-full py-5 border border-white/10 rounded-full text-[11px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/10 transition-all">Contact Sales</button>
                </div>
             </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-72 relative overflow-hidden bg-bridge-dark text-white text-center">
           <HeroScene />
           <div className="absolute inset-0 bg-gradient-to-t from-bridge-dark via-transparent to-bridge-dark" />
           <div className="relative z-10 max-w-5xl mx-auto px-8">
              <motion.h2
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="font-serif text-6xl md:text-9xl mb-16 leading-[0.85] text-white tracking-tighter"
              >
                The Bridge <br/>to Infinity.
              </motion.h2>
              <p className="text-2xl text-slate-400 mb-20 font-light max-w-2xl mx-auto">당신의 팀이 마주한 한계를 넘어서세요. <br/>BRIDGE가 가장 우아한 해답이 됩니다.</p>
              <button onClick={handleGetStarted} className="px-20 py-7 bg-white text-bridge-dark rounded-full font-bold uppercase tracking-[0.4em] text-[11px] shadow-[0_0_60px_rgba(255,255,255,0.15)] hover:scale-105 transition-all duration-700">Unite Today</button>
           </div>
        </section>
      </main>

      <footer className="bg-bridge-obsidian text-slate-500 py-40 border-t border-white/5">
        <div className="container mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-24 mb-24">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-12 h-12 bg-bridge-accent rounded-xl flex items-center justify-center text-white font-serif font-bold text-2xl">B</div>
                 <span className="font-serif font-bold text-3xl text-white">BRIDGE</span>
              </div>
              <p className="text-base leading-relaxed text-slate-500 font-light">
                Connect your team's time and tasks <br/>in one seamless, fluid flow.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-10 text-[11px] uppercase tracking-[0.4em]">Solutions</h4>
              <ul className="text-base space-y-6 font-light">
                <li><a href="#workflow" onClick={scrollToSection('workflow')} className="hover:text-bridge-secondary transition-all">Kanban Flow</a></li>
                <li><a href="#scheduling" onClick={scrollToSection('scheduling')} className="hover:text-bridge-secondary transition-all">Temporal Hub</a></li>
                <li><a href="#" className="hover:text-bridge-secondary transition-all">Milestone Logic</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-10 text-[11px] uppercase tracking-[0.4em]">Connect</h4>
              <ul className="text-base space-y-6 font-light">
                <li><a href="#" className="hover:text-bridge-secondary transition-all">LinkedIn</a></li>
                <li><a href="#" className="hover:text-bridge-secondary transition-all">Developer Portal</a></li>
                <li><a href="#" className="hover:text-bridge-secondary transition-all">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-10 text-[11px] uppercase tracking-[0.4em]">Company</h4>
              <ul className="text-base space-y-6 font-light">
                <li><a href="#" className="hover:text-bridge-secondary transition-all">Journal</a></li>
                <li><a href="#" className="hover:text-bridge-secondary transition-all">Manifesto</a></li>
                <li><a href="#" className="hover:text-bridge-secondary transition-all">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-16 border-t border-white/5 text-center text-[11px] tracking-[0.5em] uppercase font-bold text-slate-700">
            &copy; 2026 BRIDGE Collaboration Inc. Engineered for Infinite Flow.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
