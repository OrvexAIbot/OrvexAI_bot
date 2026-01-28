import React from 'react';
import { FEATURES } from '../constants';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

const Capabilities: React.FC = () => {
  return (
    <div className="px-6 py-20 max-w-7xl mx-auto">
      <div className="mb-24 text-center max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">System Capabilities</h1>
        <p className="text-xl text-neutral-400">
          Orvex is designed to replace your manual workflows with autonomous monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {FEATURES.map((feature, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group relative p-8 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-brand-500/20 hover:bg-white/[0.04] transition-all duration-300"
          >
            <div className="absolute top-8 right-8 opacity-0 group-hover:opacity-100 transition-opacity text-brand-500">
                <ArrowUpRight />
            </div>
            
            <div className="w-14 h-14 bg-black border border-white/10 rounded-xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform duration-300 group-hover:border-brand-500/50 shadow-lg">
              {feature.icon}
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">{feature.title}</h2>
            
            <p className="text-neutral-400 leading-relaxed text-lg mb-8">
              {feature.description}
            </p>
            
            <div className="flex gap-3">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-neutral-400 font-mono">Real-time</span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs text-neutral-400 font-mono">Automated</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Capabilities;