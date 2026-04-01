import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MainLogo from '../components/MainLogo';
import SplineScene from '../components/SplineScene';
import {
  ArrowRight,
  Languages,
  Activity,
  Zap,
  FileText,
} from 'lucide-react';

// Detect mobile once (pointer: coarse = touch device)
const IS_MOBILE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

const FLOATING_LANGUAGES = [
  { text: 'Hello', lang: 'English', top: '15%', left: '45%', delay: 0 },
  { text: 'नमस्ते', lang: 'Hindi', top: '20%', left: '75%', delay: 0.4 },
  { text: '你好', lang: 'Chinese', top: '40%', left: '88%', delay: 0.8 },
  { text: 'Hola', lang: 'Spanish', top: '70%', left: '82%', delay: 1.2 },
  { text: 'Bonjour', lang: 'French', top: '88%', left: '55%', delay: 1.6 },
  { text: 'مرحبا', lang: 'Arabic', top: '80%', left: '25%', delay: 2.0 },
  { text: 'こんにちは', lang: 'Japanese', top: '62%', left: '12%', delay: 2.4 },
  { text: '안녕하세요', lang: 'Korean', top: '25%', left: '18%', delay: 2.8 }
];

/* Main Page */
const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineContainerRef = useRef<HTMLDivElement>(null);
  const [splineApp, setSplineApp] = useState<any>(null);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });

  useEffect(() => {
    if (!splineApp || !containerRef.current) return;

    const handleScroll = () => {
      const offsetTop = containerRef.current!.offsetTop;
      const scrollY = window.scrollY;
      const scrollableDistance = containerRef.current!.clientHeight - window.innerHeight;
      let progress = (scrollY - offsetTop) / scrollableDistance;
      progress = Math.max(0, Math.min(1, progress));
      splineApp.setVariable('scrollProgress', progress);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [splineApp]);

  // Block native scroll/wheel events from reaching the Spline canvas
  // so its built-in scroll animation doesn't fire
  useEffect(() => {
    const el = splineContainerRef.current;
    if (!el) return;
    const blockWheel = (e: WheelEvent) => {
      e.stopPropagation();
    };
    // Use capture phase to intercept before Spline runtime gets the event
    el.addEventListener('wheel', blockWheel, { capture: true, passive: false });
    return () => el.removeEventListener('wheel', blockWheel, { capture: true });
  }, []);

  const textOpacity = useTransform(scrollYProgress, [0, 0.22], [0.72, 1]);
  const textY = useTransform(scrollYProgress, [0, 0.22], [16, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.22], [0.98, 1]);
  const textBlurPx = useTransform(scrollYProgress, [0, 0.22], [6, 0]);
  const textFilter = useTransform(textBlurPx, (v) => `blur(${v}px)`);

  const navOpacity = useTransform(scrollYProgress, [0.1, 0.3], [0, 1]);
  const navY = useTransform(scrollYProgress, [0.1, 0.3], [-18, 0]);
  const ctaOpacity = useTransform(scrollYProgress, [0.28, 0.46], [0, 1]);
  const ctaY = useTransform(scrollYProgress, [0.28, 0.46], [16, 0]);
  const taglineOpacity = useTransform(scrollYProgress, [0.32, 0.5], [0, 1]);
  const taglineY = useTransform(scrollYProgress, [0.32, 0.5], [16, 0]);

  // No scale/blur/opacity transforms for the 3D scene — always visible at full size
  const cardsOpacity = useTransform(scrollYProgress, [0.48, 0.74], [0, 1]);
  const cardsY = useTransform(scrollYProgress, [0.48, 0.74], [24, 0]);
  const langsOpacity = useTransform(scrollYProgress, [0.38, 0.62], [0, 1]);
  const langsY = useTransform(scrollYProgress, [0.38, 0.62], [30, 0]);

  const rawGlobeX = useTransform(scrollYProgress, [0, 0.45], ['-100vw', '-4vw']);
  const globeX = useSpring(rawGlobeX, { stiffness: 60, damping: 20 });
  const globeOpacity = useTransform(scrollYProgress, [0, 0.35], [0, 1]);

  // ── Mobile render — Spline globe + hero text + clean nav ──────────────────
  if (IS_MOBILE) {
    return (
      <div className="min-h-screen bg-white overflow-x-hidden flex flex-col">
        {/* Dot grid background */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(171,173,175,0.2) 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* ── Mobile Navbar ── */}
        <nav className="relative z-[100] flex items-center justify-between px-4 py-6 bg-white/50 backdrop-blur-md border-b border-[var(--outline-variant)]">
          <div className="flex-shrink-0">
            <MainLogo className="h-9 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth"
              className="text-[13px] font-bold text-[#595c5e] hover:text-[#4a40e0]"
            >
              Log In
            </Link>
            <Link
              to="/auth"
              state={{ isSignUp: true }}
              className="bg-[#4a40e0] text-white text-[12px] font-bold px-4 py-2.5 rounded-full shadow-lg shadow-[#4a40e0]/20 active:scale-95 transition-all"
            >
              Start now
            </Link>
          </div>
        </nav>

        {/* ── Mobile Hero Content ── */}
        <div className="relative z-10 px-5 pt-8 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1.5 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-[10px] font-black uppercase tracking-widest border border-[#4a40e0]/10">
              Smart Multilingual Assistant
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] font-extrabold text-[#2c2f31] leading-[1.05] tracking-tighter font-['Manrope'] text-center mb-4">
            Type in <span className="text-[#4a40e0]">Any</span><br />Language
            <span className="block text-[1.4rem] text-[#595c5e] font-bold mt-2 tracking-normal uppercase opacity-70">Instantly with AI</span>
          </h1>

          <p className="text-[#595c5e] text-[15px] leading-relaxed max-w-[320px] mx-auto font-medium text-center mb-6">
            Plan, write, and communicate in any language with AI-powered clarity and speed.
          </p>

          <Link
            to="/auth"
            state={{ isSignUp: true }}
            className="inline-flex items-center gap-4 bg-[#4a40e0] text-white pl-8 pr-4 py-4 rounded-full text-[15px] font-bold shadow-2xl shadow-[#4a40e0]/30 active:scale-95 mb-8"
          >
            Start Typing
            <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* ── Spline Container ── */}
        <div className="relative w-full aspect-square mt-[-20px] mb-[-40px] z-0">
          <SplineScene
            scene="https://prod.spline.design/qvzyYFDHYJpr5kQt/scene.splinecode"
            onLoad={(app) => setSplineApp(app)}
            className="w-full h-full"
          />

          {/* Static Floating labels for better mobile performance and visibility */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { text: 'नमस्ते', top: '15%', right: '12%' },
              { text: '你好', top: '45%', right: '8%' },
              { text: 'Hola', bottom: '25%', right: '12%' },
              { text: 'Bonjour', bottom: '15%', left: '40%' },
              { text: 'مرحبا', bottom: '30%', left: '8%' },
              { text: '안녕하세요', top: '25%', left: '8%' },
            ].map(({ text, ...pos }) => (
              <div
                key={text}
                className="absolute bg-white/95 backdrop-blur-xl px-2.5 py-1.5 rounded-xl shadow-xl border border-white/50 text-[11px] font-black text-[#2c2f31]"
                style={pos}
              >
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* Features Preview */}
        <div className="relative z-10 px-6 pt-12 pb-16">
          <div className="grid grid-cols-1 gap-4">
            {[
              { icon: Languages, title: 'Auto Language Detection', bg: 'bg-[#4a40e0]/10', color: 'text-[#4a40e0]' },
              { icon: Activity, title: 'Real-time Translation', bg: 'bg-[#16a34a]/10', color: 'text-[#16a34a]' },
            ].map(({ icon: Icon, title, bg, color }) => (
              <div key={title} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-[var(--outline-variant)] flex items-center gap-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <span className="font-extrabold text-[#2c2f31] text-sm">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Footer */}
        <footer className="relative z-10 bg-white border-t border-[var(--outline-variant)] py-8 text-center mt-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#abadaf]">
            &copy; 2026 LexiFlow AI
          </p>
        </footer>
      </div>
    );
  }


  // ── Desktop render (unchanged) ────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ height: '400vh' }}>

      {/* Sticky Hero */}
      <div className="sticky top-0 h-screen overflow-hidden bg-white">
        {/* Dot grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(171,173,175,0.2) 1.5px, transparent 1.5px)',
            backgroundSize: '32px 32px',
          }}
        />
        {/* Nav */}
        <motion.nav
          style={{ opacity: navOpacity, y: navY }}
          className="relative z-50 mx-auto flex max-w-[1400px] items-center justify-between px-8 py-6 md:py-8 top-0"
        >
          <div className="flex items-center gap-2.5">
            <MainLogo className="h-20 md:h-24 w-auto object-contain origin-left scale-125 md:scale-150" />
          </div>
          <div className="flex items-center gap-5">
            <Link to="/auth" className="text-[15px] font-bold text-[#595c5e] hover:text-[#4a40e0] transition-colors">Log In</Link>
            <Link to="/auth" state={{ isSignUp: true }} className="app-button-primary rounded-full px-6 py-2.5 text-sm font-bold shadow-sm hover:shadow-md transition-all">
              Start now
            </Link>
          </div>
        </motion.nav>

        {/* Hero Content */}
        <div className="relative h-[calc(100vh-88px)]">
          {/* Headline and Tagline Group */}
          <motion.div
            style={{ opacity: textOpacity, y: textY, scale: textScale, filter: textFilter }}
            className="absolute left-[8%] right-[1%] xl:left-[12%] xl:right-auto top-[200%] md:top-[0%] z-20 max-w-[600px] flex flex-col gap-4 items-start"
          >
            <span className="inline-block px-3 py-1.5 bg-[#4a40e0]/10 text-[#4a40e0] rounded-full text-xs font-bold uppercase tracking-widest border border-[#4a40e0]/10">Smart Typing Engine</span>

            <h1 className="text-[3rem] md:text-[3.8rem] font-extrabold text-[#2c2f31] leading-[1.1] tracking-tight font-['Manrope']">
              Type in Any<br />Language
              <span className="block text-[#4a40e0] mt-1">instantly with AI</span>
            </h1>

            <motion.p style={{ y: taglineY, opacity: taglineOpacity }}
              className="text-[#595c5e] text-[17px] leading-relaxed max-w-[400px] font-medium mt-2">
              Plan, write, and communicate in any language with AI-powered clarity and momentum. The future of global documentation.
            </motion.p>

            <motion.div style={{ opacity: ctaOpacity, y: ctaY }} className="mt-4">
              <Link to="/auth" state={{ isSignUp: true }}
                className="group inline-flex items-center gap-4 bg-[#4a40e0] hover:bg-[#3d30d4] text-white pl-8 pr-4 py-3.5 rounded-full text-[15px] font-bold shadow-xl shadow-[#4a40e0]/20 transition-all hover:-translate-y-1">
                Start Typing
                <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero 3D Scene — shifted right */}
          <motion.div
            ref={splineContainerRef}
            style={{ x: globeX, opacity: globeOpacity }}
            className="absolute top-0 right-0 bottom-0 w-full lg:w-[65%] flex items-center justify-center pointer-events-auto z-0"
          >
            <div className="relative w-full max-w-[800px] aspect-square flex items-center justify-center">
              <SplineScene
                scene="https://prod.spline.design/qvzyYFDHYJpr5kQt/scene.splinecode"
                onLoad={(app) => {
                  setSplineApp(app);
                }}
                className="w-full h-full"
              />

              {/* Floating language labels — scroll-driven like stat cards */}
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                style={{ opacity: langsOpacity, y: langsY }}
              >
                {FLOATING_LANGUAGES.map(({ text, lang, top, left, delay }, i) => (
                  <div
                    key={text}
                    className="absolute pointer-events-auto cursor-default group"
                    style={{ top, left, transform: 'translate(-50%, -50%)' }}
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        y: { duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: delay },
                      }}
                      whileHover={{ scale: 1.1 }}
                      className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-lg shadow-[#4a40e0]/15 border border-white/40 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-[#4a40e0]/30 group-hover:bg-white text-center"
                    >
                      <p className="text-base font-extrabold text-[#2c2f31] leading-tight">{text}</p>
                      <p className="text-[10px] font-bold text-[#4a40e0] uppercase tracking-widest mt-0.5">{lang}</p>
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Floating stat cards */}
          <motion.div className="absolute inset-0 pointer-events-none z-10 hidden md:block"
            style={{ opacity: cardsOpacity, y: cardsY }}>

            {/* Top-left: speed */}
            <div className="absolute top-[43%] left-[32%] bg-white/90 backdrop-blur-xl border border-[var(--outline-variant)] rounded-2xl p-4.5 shadow-xl flex items-center gap-4">
              <div className="w-14 h-12 bg-[#4a40e0]/10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#4a40e0]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#595c5e] uppercase tracking-widest mb-0.5">Speed</p>
                <p className="text-[-15px] font-extrabold text-[#2c2f31]">2× Faster Typing</p>
              </div>
            </div>

            {/* Bottom-left: document formats */}
            <div className="absolute bottom-[17%] left-[28%] bg-white/90 backdrop-blur-xl border border-[var(--outline-variant)] rounded-2xl p-4.5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-[#16a34a]/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#595c5e] uppercase tracking-widest mb-0.5">Exports</p>
                <p className="text-[15px] font-extrabold text-[#2c2f31]">PDF · Cloud</p>
              </div>
            </div>

            {/* Right: accuracy */}
            <div className="absolute right-[5%] top-[45%] bg-white/90 backdrop-blur-xl border border-[var(--outline-variant)] rounded-2xl p-5 shadow-xl w-48">
              <p className="text-[10px] font-black text-[#595c5e] uppercase tracking-widest mb-1.5">AI Accuracy</p>
              <p className="text-[2.5rem] font-extrabold text-[#4a40e0] leading-none tracking-tight font-['Manrope']">99.8%</p>
              <div className="mt-3 h-1.5 w-full bg-[#f5f7f9] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#4a40e0] to-[#8b5cf6] rounded-full" style={{ width: '99.8%' }} />
              </div>
            </div>

          </motion.div>
        </div>
      </div>{/* end sticky */}

      {/* Features section */}
      <section className="bg-[#f5f7f9] py-32 px-6" id="solutions">
        <div className="max-w-[1200px] mx-auto text-center">
          <h2 className="text-[2.5rem] md:text-[3.5rem] font-extrabold text-[#2c2f31] mb-5 tracking-tight font-['Manrope'] leading-[1.1]">
            Everything you need to write<br />in any language
          </h2>
          <p className="text-[#595c5e] text-lg mb-20 max-w-2xl mx-auto leading-relaxed">
            LexiFlow AI combines real-time translation, intelligent suggestions, and seamless document processing in one beautiful workspace.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { icon: Languages, title: 'Auto Language Detection', desc: 'Instantly identifies what language you are typing — no manual switching required.', color: 'text-[#4a40e0]', bg: 'bg-[#4a40e0]/10' },
              { icon: Zap, title: 'AI Word Prediction', desc: 'Context-aware suggestions trained on multilingual data to help you type faster.', color: 'text-[#8b5cf6]', bg: 'bg-[#8b5cf6]/10' },
              { icon: Activity, title: 'Real-time Translation', desc: 'Translate on the fly with 99.8% accuracy across 75+ languages, powered by AI.', color: 'text-[#16a34a]', bg: 'bg-[#16a34a]/10' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="surface-elevated rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[rgba(74,64,224,0.08)] border border-[var(--outline-variant)]">
                <div className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center mb-6`}>
                  <Icon className={`w-7 h-7 ${color}`} />
                </div>
                <h3 className="font-extrabold text-[#2c2f31] mb-3 text-xl font-['Manrope'] tracking-tight">{title}</h3>
                <p className="text-[#595c5e] text-base leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[var(--outline-variant)] py-10 text-center">
        <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#abadaf]">
          &copy; 2026 LexiFlow AI. All rights reserved. Let's communicate globally.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;