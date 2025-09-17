import React from 'react';

interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  className = '', 
  showText = false 
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Central black circle */}
        <circle cx="20" cy="20" r="8" fill="currentColor" className="text-black dark:text-white"/>
        
        {/* Radiating rays */}
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white dark:text-black">
          {/* Main rays */}
          <line x1="20" y1="4" x2="20" y2="12"/>
          <line x1="28" y1="8" x2="24" y2="12"/>
          <line x1="32" y1="16" x2="28" y2="16"/>
          <line x1="28" y1="24" x2="24" y2="20"/>
          <line x1="20" y1="28" x2="20" y2="36"/>
          <line x1="12" y1="24" x2="16" y2="20"/>
          <line x1="8" y1="16" x2="12" y2="16"/>
          <line x1="12" y1="8" x2="16" y2="12"/>
          
          {/* Additional rays for fuller effect */}
          <line x1="24" y1="6" x2="22" y2="10"/>
          <line x1="30" y1="12" x2="26" y2="14"/>
          <line x1="30" y1="20" x2="26" y2="18"/>
          <line x1="24" y1="26" x2="22" y2="22"/>
          <line x1="16" y1="30" x2="18" y2="26"/>
          <line x1="10" y1="24" x2="14" y2="22"/>
          <line x1="10" y1="16" x2="14" y2="18"/>
          <line x1="16" y1="10" x2="18" y2="14"/>
          
          {/* More rays for complete coverage */}
          <line x1="26" y1="4" x2="24" y2="8"/>
          <line x1="32" y1="8" x2="28" y2="10"/>
          <line x1="34" y1="14" x2="30" y2="16"/>
          <line x1="32" y1="22" x2="28" y2="20"/>
          <line x1="26" y1="30" x2="24" y2="26"/>
          <line x1="18" y1="34" x2="20" y2="30"/>
          <line x1="8" y1="26" x2="12" y2="24"/>
          <line x1="6" y1="18" x2="10" y2="16"/>
          <line x1="8" y1="10" x2="12" y2="12"/>
          <line x1="14" y1="6" x2="16" y2="10"/>
        </g>
      </svg>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold text-foreground">InscribeMate</span>
          <span className="text-xs text-muted-foreground">Accessibility-First</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
