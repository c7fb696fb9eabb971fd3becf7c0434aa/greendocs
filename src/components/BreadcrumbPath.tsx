import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbPathProps {
  breadcrumbs: BreadcrumbItem[];
  className?: string;
}

/**
 * Clean breadcrumb trail with an inline Back button styled in the SubCard obsidian glassmorphic aesthetic.
 * Listens for the physical 'Escape' key to navigate up one level.
 */
export const BreadcrumbPath: React.FC<BreadcrumbPathProps> = React.memo(({ breadcrumbs, className = '' }) => {
  const navigate = useNavigate();

  const parentCrumb = breadcrumbs.length > 1 ? breadcrumbs[breadcrumbs.length - 2] : null;

  // Listen to Escape key to step up in hierarchy
  useEffect(() => {
    if (!parentCrumb) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        navigate(parentCrumb.path);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [parentCrumb, navigate]);

  if (breadcrumbs.length <= 1 || !parentCrumb) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb navigation"
      className={`w-full flex items-center justify-between px-1 text-xs font-mono text-slate-400 select-none ${className}`}
    >
      {/* Breadcrumb Path Trail */}
      <ol className="flex items-center gap-1.5 flex-wrap">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;

          return (
            <li key={crumb.path} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-slate-600 font-sans" aria-hidden="true">/</span>}
              {isLast ? (
                <span className="text-emerald-400 font-medium font-mono" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.path}
                  className="hover:text-slate-200 transition-colors focus:outline-none focus:text-emerald-400"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* Back Button styled with SubCard glassmorphic palette */}
      <Link
        to={parentCrumb.path}
        className="h-7 px-2.5 sm:px-3 rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 inline-flex items-center gap-1.5 transition-all duration-200 shrink-0 group select-none"
        title="Go back (Escape)"
        aria-label="Go back to parent page"
      >
        <span className="font-mono text-xs text-zinc-400 group-hover:text-emerald-400 transition-colors">
          &larr;
        </span>
        <span className="font-mono text-[11px] font-medium text-slate-300 group-hover:text-white transition-colors">
          Back
        </span>
      </Link>
    </nav>
  );
});
