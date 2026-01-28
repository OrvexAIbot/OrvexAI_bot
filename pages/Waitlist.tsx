import React, { useState } from 'react';
import Button from '../components/Button';
import { motion } from 'framer-motion';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    // Simulate API call
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white mb-4">Request Access</h1>
          <p className="text-neutral-400">
            Orvex is currently in private beta. We are onboarding active traders and researchers in batches.
          </p>
        </div>

        {status === 'success' ? (
          <div className="bg-neutral-900/50 border border-neutral-800 rounded-lg p-8 text-center">
            <div className="text-emerald-500 mb-2 font-medium">Request Received</div>
            <p className="text-neutral-400 text-sm">We'll be in touch shortly.</p>
            <Button variant="outline" className="mt-6" onClick={() => setStatus('idle')}>
              Register another email
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 transition-all"
                required
              />
            </div>
            
            <div className="pt-2">
               <label className="flex items-start gap-3 text-sm text-neutral-500 mb-6 cursor-pointer">
                  <input type="checkbox" className="mt-1 bg-neutral-900 border-neutral-800 rounded" />
                  <span>I trade on-chain actively (prioritized access)</span>
               </label>
            </div>

            <Button type="submit" fullWidth disabled={status === 'loading'}>
              {status === 'loading' ? 'Processing...' : 'Join Waitlist'}
            </Button>
            
            <p className="text-center text-xs text-neutral-600 mt-6">
              Your data is never shared. We hate spam as much as you do.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Waitlist;