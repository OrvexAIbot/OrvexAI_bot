import React, { useEffect, useRef } from 'react';
import { Send, MoreVertical, ArrowLeft, Phone, CheckCheck, Sparkles } from 'lucide-react';
import { gsap } from 'gsap';

const TelegramMockup: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 6 });
      
      // Initial state: clear messages
      const msgs = messagesRef.current?.children;
      if (!msgs) return;
      
      gsap.set(msgs, { opacity: 0, y: 10 });
      gsap.set(inputRef.current, { value: "" });

      // 1. User types command
      tl.to(inputRef.current, { 
        value: "/predict --chain solana --horizon 24h", 
        duration: 2, 
        ease: "power1.inOut",
      });

      // 2. Button press effect
      tl.to(buttonRef.current, { scale: 0.9, duration: 0.1, yoyo: true, repeat: 1 });
      tl.to(inputRef.current, { value: "", duration: 0.1 }); // Clear input

      // 3. User message appears
      tl.to(msgs[0], { opacity: 1, y: 0, duration: 0.3 });

      // 4. Bot "Typing..." state (simulated delay for AI thinking)
      tl.to({}, { duration: 1 }); 

      // 5. Bot reply (Analysis) appears
      tl.to(msgs[1], { opacity: 1, y: 0, duration: 0.4 });
      
      // 6. Bot detailed prediction card appears
      tl.to(msgs[2], { opacity: 1, y: 0, duration: 0.5, delay: 0.4 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full max-w-sm mx-auto bg-[#17212b] rounded-3xl overflow-hidden border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] font-sans relative">
      {/* Telegram Header */}
      <div className="bg-[#232e3c] px-4 py-3 flex items-center justify-between border-b border-black/20 z-10 relative">
        <div className="flex items-center gap-4">
          <ArrowLeft className="w-5 h-5 text-white" />
          <div className="flex items-center gap-3">
             <div className="relative">
                <img src="/logo.png" alt="Orvex" className="w-8 h-8 rounded-full object-contain shadow-lg bg-[#232e3c]" />
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-3 h-3 rounded-full border-2 border-[#232e3c]"></div>
             </div>
             <div>
                <div className="text-white font-semibold text-sm leading-tight flex items-center gap-1.5">
                  Orvex AI
                  <Sparkles className="w-3 h-3 text-brand-500 fill-brand-500" />
                </div>
                <div className="text-telegram-500 text-[11px] font-medium tracking-wide opacity-90">bot • powered by claude</div>
             </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-neutral-400">
           <Phone className="w-5 h-5 opacity-50" />
           <MoreVertical className="w-5 h-5 opacity-50" />
        </div>
      </div>

      {/* Chat Area */}
      <div className="bg-[#0e1621] h-[400px] p-4 relative overflow-hidden">
        {/* Chat Pattern Background */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>
        
        <div ref={messagesRef} className="flex flex-col gap-3 h-full justify-end pb-2 relative z-10">
          
          {/* User Message */}
          <div className="self-end max-w-[85%]">
             <div className="bg-[#2b5278] p-3 rounded-2xl rounded-tr-none text-white text-[13px] leading-relaxed shadow-sm relative">
                <span className="font-mono opacity-80">/predict --chain solana --horizon 24h</span>
                <div className="flex justify-end items-center gap-1 mt-1 opacity-60">
                   <span className="text-[10px]">14:02</span>
                   <CheckCheck className="w-3 h-3" />
                </div>
             </div>
          </div>

          {/* Bot Message 1: Analysis */}
          <div className="self-start max-w-[92%]">
             <div className="bg-[#182533] p-3.5 rounded-2xl rounded-tl-none text-white text-[13px] shadow-md border border-white/[0.03]">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-brand-500 font-bold text-xs flex items-center gap-1">
                        <Sparkles size={10} /> CLAUDE ANALYSIS
                    </span>
                </div>
                <p className="leading-relaxed text-neutral-200">
                    Scanning active Solana pools for divergence...
                    <br/>
                    <span className="text-neutral-400 text-xs">Processing 14,203 transactions/sec.</span>
                </p>
                <div className="mt-2 text-xs text-neutral-400 border-l-2 border-brand-500/50 pl-2">
                    Found significant anomaly on <span className="text-brand-400 font-medium">$CHILL</span>. Smart wallet accumulation detected before price impact.
                </div>
                <div className="flex justify-end mt-1.5 opacity-50 text-[10px]">14:02</div>
             </div>
          </div>

          {/* Bot Message 2: Prediction Card */}
          <div className="self-start max-w-[92%]">
             <div className="bg-[#182533] p-0 rounded-2xl rounded-tl-none overflow-hidden shadow-lg border border-white/[0.05]">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-brand-600/20 to-transparent p-3 border-b border-white/[0.05] flex justify-between items-center">
                    <span className="text-brand-400 font-bold text-xs tracking-wider">ALPHA ALERT</span>
                    <span className="bg-brand-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">98% MATCH</span>
                </div>
                
                {/* Card Body */}
                <div className="p-3.5 space-y-3">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="text-lg font-bold text-white tracking-tight">$CHILL / SOL</div>
                            <div className="text-[11px] text-neutral-400 font-mono">CA: 8c7...9f2</div>
                        </div>
                        <div className="text-right">
                            <div className="text-emerald-400 font-bold text-sm">+12.4%</div>
                            <div className="text-[10px] text-neutral-500">Last 5m</div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-400">Signal</span>
                            <span className="text-white font-medium">Insider Accumulation</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-400">Volume</span>
                            <span className="text-white font-medium">$450K (Spiking)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-400">Prediction</span>
                            <span className="text-brand-400 font-bold">Breakout Imminent</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <button className="bg-white/10 hover:bg-white/20 transition-colors py-2 rounded text-xs font-medium text-white">
                            Chart
                        </button>
                        <button className="bg-brand-600 hover:bg-brand-500 transition-colors py-2 rounded text-xs font-medium text-white shadow-lg shadow-brand-500/20">
                            Snipe
                        </button>
                    </div>
                </div>
                <div className="bg-[#0e1621]/50 p-2 text-[10px] text-neutral-500 text-center font-mono">
                    Model: Claude Opus 4.5 • Latency: 42ms
                </div>
             </div>
          </div>

        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#17212b] p-2 flex items-center gap-2 border-t border-black/20 z-10 relative">
         <div className="w-8 h-8 rounded-full bg-transparent flex items-center justify-center text-neutral-500 hover:text-neutral-300 transition-colors">
            <div className="w-6 h-6 border-2 border-current rounded-lg"></div>
         </div>
         <input 
            ref={inputRef}
            type="text" 
            placeholder="Broadcast to channel..." 
            className="flex-1 bg-transparent text-white text-[13px] placeholder-neutral-500 focus:outline-none font-sans"
            readOnly
         />
         <button ref={buttonRef} className="w-10 h-10 rounded-full flex items-center justify-center text-telegram-500 hover:bg-white/5 transition-colors">
            <Send className="w-5 h-5 fill-current" />
         </button>
      </div>
    </div>
  );
};

export default TelegramMockup;