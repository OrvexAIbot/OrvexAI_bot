import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../constants';
import Button from './Button';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="min-h-screen flex flex-col bg-[#020202] text-white font-sans selection:bg-brand-500/30 selection:text-brand-500 relative overflow-x-hidden">
      
      {/* Background Grid - Global */}
      <div className="fixed inset-0 z-0 bg-grid-pattern pointer-events-none opacity-40"></div>
      
      {/* Ambient Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Navigation */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          isScrolled
            ? 'bg-[#020202]/80 backdrop-blur-xl border-white/5 py-2'
            : 'bg-transparent border-transparent py-3'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="z-50">
            <img src="/logo.png" alt="Orvex" className="w-28 h-28 object-contain -my-10" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className={`text-sm font-medium px-4 py-2 rounded-md transition-all ${
                  location.pathname === item.path 
                    ? 'text-white bg-white/5' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div>
              <Button to="https://t.me/orvexai_bot" variant="primary" className="h-9 px-4 text-xs shadow-none">
                Start Monitoring
              </Button>
            </div>
          </nav>

          {/* Mobile Menu Toggle - Only show if there are items or just for the CTA */}
          <div className="md:hidden flex items-center">
             <Button to="https://t.me/orvexai_bot" variant="primary" className="h-8 px-3 text-xs shadow-none">
                Start
             </Button>
          </div>

        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24 z-10 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-32 py-16 bg-[#020202] relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start gap-12">
          <div>
            <div className="mb-4">
               <img src="/logo.png" alt="Orvex" className="w-28 h-28 object-contain" />
            </div>
            <p className="text-neutral-500 text-sm max-w-xs leading-relaxed">
              Autonomous crypto surveillance infrastructure. <br />
              Built for operators who demand signal, not noise.
            </p>
          </div>
                  </div>
        <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-white/5 text-xs text-neutral-700 flex justify-between items-center">
          <span>© {new Date().getFullYear()} Orvex Systems Inc.</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500/80">Systems Operational</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;