import React from 'react';
import { EXAMPLE_ALERTS } from '../constants';
import AlertCard from '../components/AlertCard';
import { motion } from 'framer-motion';

const Examples: React.FC = () => {
  return (
    <div className="px-6 py-20 max-w-7xl mx-auto">
      <div className="text-center mb-24">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">Live Intelligence</h1>
        <p className="text-xl text-neutral-400 max-w-2xl mx-auto">
          See exactly what Orvex sends you. No noise, just signal.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start">
        {/* Left Column: Context */}
        <div className="space-y-16 lg:sticky lg:top-32">
            <div className="relative pl-8 border-l border-white/10">
                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-brand-500 rounded-full"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Whale Tracking</h3>
                <p className="text-neutral-400 text-lg leading-relaxed">
                    Don't just watch the price. Watch who is moving the price. Orvex identifies wallets labeled as "Smart Money" or "Insiders" and alerts you when they make a move.
                </p>
            </div>
            <div className="relative pl-8 border-l border-white/10">
                 <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-neutral-700 rounded-full"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Risk Detection</h3>
                <p className="text-neutral-400 text-lg leading-relaxed">
                    Before you ape, let Orvex check the contract. It simulates transactions and checks liquidity lock status instantly.
                </p>
            </div>
             <div className="relative pl-8 border-l border-white/10">
                 <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 bg-neutral-700 rounded-full"></div>
                <h3 className="text-2xl font-bold text-white mb-4">Portfolio Defense</h3>
                <p className="text-neutral-400 text-lg leading-relaxed">
                    If liquidity is pulled from a pool you are invested in, you need to know immediately.
                </p>
            </div>
        </div>

        {/* Right Column: Cards */}
        <div className="flex flex-col gap-8 items-center lg:items-end w-full">
            {EXAMPLE_ALERTS.map((alert, idx) => (
                <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.2 }}
                    viewport={{ once: true }}
                    className="w-full max-w-md"
                >
                    <AlertCard data={alert} />
                </motion.div>
            ))}
             <div className="w-full max-w-md p-8 border border-dashed border-white/10 rounded-xl text-center text-neutral-500 text-sm font-mono bg-white/[0.02]">
                // + Custom alerts configured by you
            </div>
        </div>
      </div>
    </div>
  );
};

export default Examples;