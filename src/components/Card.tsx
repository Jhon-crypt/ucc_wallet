import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 ${className}`}>
      {children}
    </div>
  );
}

interface ClickableCardProps extends CardProps {
  onClick: () => void;
}

export function ClickableCard({ children, className = '', onClick }: ClickableCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 cursor-pointer hover:bg-gray-800/70 transition-colors ${className}`}
    >
      {children}
    </div>
  );
} 