import React from 'react';
import { Link } from 'react-router-dom';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  to?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  to, 
  onClick, 
  className = '', 
  type = 'button',
  fullWidth = false
}) => {
  const baseStyles = "inline-flex items-center justify-center px-6 py-3 text-sm font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none tracking-wide font-sans rounded-lg";
  
  const variants = {
    // Brand orange glow style
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-[0_0_20px_-5px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_-5px_rgba(249,115,22,0.6)] border border-transparent",
    // Dark glass style
    secondary: "bg-white/5 text-white hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20",
    // Outline style
    outline: "bg-transparent text-neutral-400 border border-neutral-800 hover:border-neutral-600 hover:text-white",
    ghost: "bg-transparent text-neutral-400 hover:text-white"
  };

  const widthClass = fullWidth ? "w-full" : "";

  const classes = `${baseStyles} ${variants[variant]} ${widthClass} ${className}`;

  if (to) {
    // External link
    if (to.startsWith('http') || to.startsWith('https')) {
      return (
        <a href={to} target="_blank" rel="noopener noreferrer" className={classes}>
          {children}
        </a>
      );
    }
    // Internal link
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
};

export default Button;