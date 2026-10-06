import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { DotMatrixBackground } from './components/ui/DotMatrixBackground';
import { HomePage } from './pages/HomePage';
import { DynamicPageView } from './pages/DynamicPageView';

/**
 * Main Application Routing Architecture:
 * - basename={import.meta.env.BASE_URL} enables seamless deployment to GitHub Pages sub-paths (/greendocs/)
 * - / : Root directory rendering top-level pages as minimalist small sub-cards
 * - /* : Dynamic hierarchical page router supporting arbitrary nesting (/opencv, /opencv/imageprocessing, etc.)
 */
export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <div className="min-h-screen bg-[#070a0e] text-slate-200 antialiased flex flex-col relative overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-300">
        {/* Reusable Obsidian Dot Matrix & Ambient Glow Background */}
        <DotMatrixBackground />

        {/* Global Navigation Header with centered brand badge */}
        <Header />

        {/* Main Viewport Content */}
        <main className="relative z-10 flex-1 flex flex-col items-center px-4 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pt-8 pb-16 w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/*" element={<DynamicPageView />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
