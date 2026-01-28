import React from 'react';
import { AlertData, AlertType, Feature } from './types';
import { Sparkles, Brain, Eye, Zap, TrendingUp, Crosshair } from 'lucide-react';

export const NAV_ITEMS = [];

export const FEATURES: Feature[] = [
  {
    title: 'Claude Intelligence',
    description: 'Powered by Anthropic\'s Claude 3.5. It understands complex on-chain relationships and narrative shifts better than any script.',
    icon: <Brain className="w-5 h-5" />
  },
  {
    title: 'Solana Deep Scan',
    description: 'Monitors every slot on Solana. Detects new Raydium pools, Pump.fun graduations, and insider wallet clusters instantly.',
    icon: <Zap className="w-5 h-5" />
  },
  {
    title: 'Predictive Modeling',
    description: 'Identifies the "next 100x" candidates by comparing current volume patterns against historical breakout data.',
    icon: <TrendingUp className="w-5 h-5" />
  },
  {
    title: 'Sniper Signals',
    description: 'Get the exact contract address and entry zone sent to your Telegram the second our AI confirms the setup.',
    icon: <Crosshair className="w-5 h-5" />
  }
];

export const EXAMPLE_ALERTS: AlertData[] = [
  {
    id: '1',
    type: AlertType.PREDICTION,
    title: 'High Confidence Breakout',
    timestamp: 'Just now',
    details: [
      { label: 'Asset', value: '$POPCAT (Solana)', highlight: true },
      { label: 'Signal', value: 'Volume Divergence', highlight: false },
      { label: 'AI Score', value: '98/100 (Bullish)', highlight: true },
      { label: 'Target', value: '+450% Potential', highlight: true },
    ],
    footer: 'Pattern matches $WIF early accumulation.'
  },
  {
    id: '2',
    type: AlertType.ALPHA,
    title: 'Smart Money Entry',
    timestamp: '2 mins ago',
    details: [
      { label: 'Pool', value: 'New Raydium Pair', highlight: false },
      { label: 'Wallet', value: 'Unknown (Insiders)', highlight: true },
      { label: 'Action', value: 'Accumulating 4% Supply', highlight: true },
      { label: 'Narrative', value: 'AI Agents', highlight: false },
    ],
    footer: 'Wallet previously bought $GOAT early.'
  },
  {
    id: '3',
    type: AlertType.WHALE,
    title: 'Solana Whale Alert',
    timestamp: '14:02 UTC',
    details: [
      { label: 'Token', value: '$JUP (Jupiter)', highlight: true },
      { label: 'Size', value: '$1.2M USDC Buy', highlight: true },
      { label: 'Exchange', value: 'Orca Whirlpool', highlight: false },
    ],
    footer: 'Significant absorption of sell pressure.'
  }
];