import React from 'react';
import { NavLink } from 'react-router-dom';

export const Header: React.FC = React.memo(() => {
  return (
    <header className="w-full border-b border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
        {/* Mintlify Signature Leaf Icon - Centered */}
        <NavLink
          to="/"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-sm shadow-emerald-500/20 hover:scale-105 transition-transform focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          aria-label="Home"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-slate-950"
          >
            <path
              d="M12 2L19.5 6.5V15.5L12 20L4.5 15.5V6.5L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="11" r="3" fill="currentColor" />
          </svg>
        </NavLink>
      </div>
    </header>
  );
});
