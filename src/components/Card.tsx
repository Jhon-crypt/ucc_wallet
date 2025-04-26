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