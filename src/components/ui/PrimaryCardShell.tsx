import React from 'react';

export interface PrimaryCardShellProps {
  /** Card children elements (typically SubCard and StraightLineInput) */
  children: React.ReactNode;
  /** Optional custom CSS classes to merge */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

/**
 * Reusable PrimaryCardShell providing the master obsidian gradient container,
 * 8px rounded corners (`rounded-lg`), subtle white border, and deep ambient shadow.
 */
export const PrimaryCardShell: React.FC<PrimaryCardShellProps> = ({
  children,
  className = '',
  style,
}) => {
  return (
    <div
      style={style}
      className={`w-full min-h-[315px] sm:min-h-[325px] h-[325px] rounded-lg overflow-hidden border border-white/10 bg-gradient-to-b from-[#0e141e] to-[#0a0e14] shadow-2xl p-3.5 sm:p-4 flex flex-col gap-3 sm:gap-3.5 ${className}`}
    >
      {children}
    </div>
  );
};
