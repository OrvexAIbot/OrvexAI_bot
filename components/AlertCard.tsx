import React from 'react';
import { AlertData, AlertType } from '../types';
import { AlertTriangle, TrendingUp, Lock, Sparkles, Brain, Activity, Terminal } from 'lucide-react';

interface AlertCardProps {
  data: AlertData;
}

const AlertCard: React.FC<AlertCardProps> = ({ data }) => {
  const getTheme = (type: AlertType) => {
    switch (type) {
      case AlertType.ALPHA: 
        return { 
            icon: <Sparkles className="w-4 h-4 text-purple-400" />,
            border: 'border-purple-500/30',
            bg: 'from-purple-900/10 to-transparent',
            text: 'text-purple-400'
        };
      case AlertType.PREDICTION: 
        return { 
            icon: <Brain className="w-4 h-4 text-brand-500" />,
            border: 'border-brand-500/30',
            bg: 'from-brand-900/10 to-transparent',
            text: 'text-brand-500'
        };
      case AlertType.WHALE: 
        return { 
            icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
            border: 'border-emerald-500/30',
            bg: 'from-emerald-900/10 to-transparent',
            text: 'text-emerald-500'
        };
      case AlertType.RISK: 
        return { 
            icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
            border: 'border-red-500/30',
            bg: 'from-red-900/10 to-transparent',
            text: 'text-red-500'
        };
      default: 
        return { 
            icon: <Activity className="w-4 h-4 text-blue-500" />,
            border: 'border-blue-500/30',
            bg: 'from-blue-900/10 to-transparent',
            text: 'text-blue-500'
        };
    }
  };

  const theme = getTheme(data.type);

  return (
    <div className={`relative overflow-hidden bg-[#050505] border ${theme.border} rounded-xl shadow-2xl font-mono text-sm w-full group transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_30px_-10px_rgba(255,255,255,0.05)]`}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          {theme.icon}
          <span className="font-bold text-white tracking-tight text-xs uppercase">{data.title}</span>
        </div>
        <span className="text-[10px] text-neutral-600 font-mono">{data.timestamp}</span>
      </div>

      {/* Content */}
      <div className={`p-5 bg-gradient-to-br ${theme.bg}`}>
        <div className="space-y-3">
          {data.details.map((detail, idx) => (
            <div key={idx} className="flex justify-between items-center border-b border-white/5 pb-2 last:border-0 last:pb-0">
              <span className="text-neutral-500 text-xs uppercase tracking-wide">{detail.label}</span>
              <span className={`text-right font-medium ${detail.highlight ? 'text-white' : 'text-neutral-400'}`}>
                {detail.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        {data.footer && (
          <div className="mt-4 pt-3 flex items-center gap-2 text-[10px] text-neutral-500">
            <Terminal size={10} />
            <span className="opacity-70">Model Output: {data.footer}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertCard;