import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FEATURES, EXAMPLE_ALERTS } from '../constants';
import Button from '../components/Button';
import AlertCard from '../components/AlertCard';
import NetworkBackground from '../components/NetworkBackground';
import TelegramMockup from '../components/TelegramMockup';
import { Zap, TrendingUp, Crosshair, Brain, Send, Check } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Home: React.FC = () => {
  const featuresRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate Section Title
      gsap.from(titleRef.current, {
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 85%",
        },
        y: 30,
        opacity: 0,
        duration: 1,
        ease: "power3.out"
      });

      // Animate Cards Staggered
      const cards = gsap.utils.toArray('.feature-card');
      gsap.from(cards, {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 75%",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });
    }, featuresRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* 3D Background */}
      <NetworkBackground />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 md:pt-32 md:pb-48 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 md:gap-20">
        
        {/* Left: Text Content */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-left max-w-2xl z-10 flex-1"
        >
          <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono text-brand-500 mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            RUNNING ON CLAUDE OPUS 4.5
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 leading-[1.1]">
            Find the next <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-purple-400 text-glow">100x coin</span> <br/>
            automatically.
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 mb-12 max-w-lg leading-relaxed font-light">
            Orvex is an AI Agent powered by <span className="text-white font-medium">Claude</span> that continuously scans Solana nodes. It predicts high-velocity breakouts and sends the alpha directly to your Telegram.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-start items-center">
             <Button to="https://t.me/orvexai_bot" className="h-14 px-8 text-base shadow-[0_0_40px_-10px_rgba(249,115,22,0.5)] flex items-center gap-2">
              <Send className="w-4 h-4" /> Open in Telegram
            </Button>
          </div>
        </motion.div>

        {/* Right: Telegram Visual */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotateY: 15 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.3, duration: 1, ease: "easeOut" }}
            className="w-full max-w-sm relative z-10 flex-1 perspective-1000"
        >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-500/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute top-10 -right-10 w-20 h-20 bg-purple-500/30 blur-[40px] rounded-full pointer-events-none"></div>
            
            <TelegramMockup />

            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-8 top-20 bg-[#1c2633] border border-white/10 p-3 rounded-xl shadow-xl hidden md:block"
            >
               <Zap className="w-6 h-6 text-brand-500" />
            </motion.div>
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-32 bg-[#1c2633] border border-white/10 p-3 rounded-xl shadow-xl hidden md:block"
            >
               <Brain className="w-6 h-6 text-purple-400" />
            </motion.div>
        </motion.div>
      </section>

      {/* Clean Grid Features */}
      <section ref={featuresRef} className="px-6 py-32 border-t border-white/5 bg-[#050505] relative z-10">
        <div className="max-w-7xl mx-auto">
          <div ref={titleRef} className="mb-20 md:text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Autonomous <span className="text-brand-500">Market Scanner</span>.</h2>
            <p className="text-neutral-400 text-lg">Most traders stare at charts. Orvex stares at the code and volume data to find opportunities before the candles print.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1 */}
            <div className="feature-card lg:col-span-2 group relative p-10 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors duration-500">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center mb-8 text-brand-500 group-hover:scale-110 transition-transform duration-500 group-hover:border-brand-500/30">
                     <Brain className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Powered By Claude Opus 4.5</h3>
                  <p className="text-neutral-400 leading-relaxed">The agent doesn't just run scripts. It uses advanced LLMs to understand narrative changes, wallet behavior context, and complex on-chain relationships.</p>
               </div>
            </div>

            {/* Card 2 */}
            <div className="feature-card group relative p-10 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors duration-500 flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform duration-500">
                     <Zap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Solana Native</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Direct RPC connection. Scans thousands of new Raydium pools per minute.</p>
               </div>
            </div>

            {/* Card 3 */}
            <div className="feature-card group relative p-10 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors duration-500 flex flex-col">
               <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10 flex-1">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center mb-8 text-white group-hover:scale-110 transition-transform duration-500">
                     <TrendingUp className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Trend Prediction</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed">Identifies accumulation patterns that historically lead to massive price breakouts.</p>
               </div>
            </div>

             {/* Card 4 */}
            <div className="feature-card lg:col-span-2 group relative p-10 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center mb-8 text-brand-500 group-hover:scale-110 transition-transform duration-500 group-hover:border-brand-500/30">
                     <Crosshair className="w-6 h-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Actionable Signals</h3>
                  <p className="text-neutral-400 leading-relaxed">No dashboard gazing. The agent pings you on Telegram with the contract address and a confidence score. You just decide to buy or not.</p>
               </div>
            </div>

            {/* Card 5 (Stats) */}
             <div className="feature-card lg:col-span-2 group relative p-10 bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/30 transition-colors duration-500 flex items-center justify-center">
                 <div className="text-center">
                     <div className="inline-block px-3 py-1 rounded-full border border-brand-500/20 bg-brand-500/5 text-brand-500 text-xs font-mono mb-4">
                         LIVE METRICS
                     </div>
                     <div className="text-4xl font-bold text-white mb-2">24/7</div>
                     <div className="text-neutral-500 text-sm">Uptime Monitoring</div>
                 </div>
                 <div className="mx-8 h-12 w-px bg-white/5"></div>
                 <div className="text-center">
                     <div className="inline-block px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-500 text-xs font-mono mb-4">
                         LATENCY
                     </div>
                     <div className="text-4xl font-bold text-white mb-2">&lt;50ms</div>
                     <div className="text-neutral-500 text-sm">Processing Speed</div>
                 </div>
            </div>

          </div>
        </div>
      </section>

      {/* Comparison / Why */}
      <section className="px-6 py-32 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Why Orvex is <br/> <span className="text-neutral-500">superior.</span></h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 rounded-lg bg-transparent hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="mt-1 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">✕</div>
                <div>
                    <h4 className="text-white font-medium mb-1">Human Research</h4>
                    <p className="text-neutral-400 text-sm">Humans sleep. Humans miss things. Orvex monitors every block, 24/7/365.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-transparent hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                <div className="mt-1 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">✕</div>
                <div>
                    <h4 className="text-white font-medium mb-1">Dumb Scripts</h4>
                    <p className="text-neutral-400 text-sm">Simple volume bots get baited by fake volume. Claude analyzes the context to avoid traps.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 rounded-lg bg-brand-900/10 border border-brand-500/20">
                <div className="mt-1 w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-black text-xs">
                  <Brain className="w-3 h-3" />
                </div>
                <div>
                    <h4 className="text-white font-medium mb-1">Claude Reasoning</h4>
                    <p className="text-neutral-300 text-sm">An agent that "thinks" about the trade. It weighs liquidity, holder distribution, and narrative fit before alerting.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-500/20 blur-[100px] rounded-full pointer-events-none"></div>
             <div className="relative z-10 space-y-4">
                {EXAMPLE_ALERTS.slice(0, 2).map((alert, i) => (
                    <motion.div 
                        key={i}
                        initial={{ x: 50, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.2 }}
                        viewport={{ once: true }}
                    >
                        <AlertCard data={alert} />
                    </motion.div>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative px-6 py-32 text-center z-10 border-t border-white/5 bg-[#020202]">
          <div className="absolute inset-0 bg-brand-500/5 opacity-30 blur-3xl pointer-events-none"></div>
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Simple, fair pricing.</h2>
              <p className="text-xl text-neutral-400">
                No credit cards. No subscriptions. Pay only when you win.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              {/* Subscription Card */}
              <div className="p-10 rounded-2xl bg-[#0A0A0A] border border-white/10 flex flex-col items-center justify-center text-center group hover:border-white/20 transition-colors shadow-2xl">
                  <h3 className="text-neutral-400 font-bold mb-4 uppercase tracking-widest text-xs">Platform Access</h3>
                  <div className="text-6xl font-bold text-white mb-2">Free</div>
                  <div className="text-neutral-500 mb-8 font-mono text-sm">Forever</div>
                  <ul className="space-y-4 text-neutral-300 text-sm mb-8 w-full max-w-xs mx-auto">
                    <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-brand-500" />
                        <span>Unlimited Solana Scanning</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-brand-500" />
                        <span>Real-time Claude Opus Analysis</span>
                    </li>
                    <li className="flex items-center gap-3">
                        <Check className="w-4 h-4 text-brand-500" />
                        <span>Instant Telegram Alerts</span>
                    </li>
                  </ul>
              </div>

              {/* Execution Fee Card */}
              <div className="relative p-10 rounded-2xl bg-[#0A0A0A] border border-brand-500/30 flex flex-col items-center justify-center text-center group hover:border-brand-500/50 transition-colors overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-brand-500/5 opacity-50 pointer-events-none"></div>
                  <div className="relative z-10">
                    <h3 className="text-brand-500 font-bold mb-4 uppercase tracking-widest text-xs">Performance Fee</h3>
                    <div className="text-6xl font-bold text-white mb-2">1%</div>
                    <div className="text-neutral-500 mb-8 font-mono text-sm">Per Bot Trade</div>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                        We only charge a small fee when you execute a trade directly through the Telegram bot. Manual trades are free.
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 text-brand-500 text-xs font-medium">
                        <Zap size={12} /> Auto-deducted
                    </div>
                  </div>
              </div>
            </div>
            
            <div className="mt-16">
                <Button to="https://t.me/orvexai_bot" className="h-14 px-12 text-lg shadow-[0_0_50px_-10px_rgba(249,115,22,0.4)]">Start Monitoring Now</Button>
            </div>
          </div>
      </section>
    </>
  );
};

export default Home;