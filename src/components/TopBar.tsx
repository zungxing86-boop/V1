import React from 'react';
import { AppView } from '../types/curriculum';

interface TopBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onOpenTutor: () => void;
}

const NAV_ITEMS: { id: AppView; label: string }[] = [
  { id: 'home', label: 'خانه و درس‌ها' },
  { id: 'vocabulary', label: 'واژگان هوشمند' },
  { id: 'grammar', label: 'گرامر گام‌به‌گام' },
  { id: 'review', label: 'مرور و گزارش' },
  { id: 'blueprint', label: 'مخاطب و خروجی APK' },
];

export const TopBar: React.FC<TopBarProps> = ({ currentView, onNavigate, onOpenTutor }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-4">
        {/* Zone 1: Single text element wordmark */}
        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => onNavigate('home')}
          className="text-xl font-extrabold tracking-tight text-teal-700 dark:text-teal-400 whitespace-nowrap shrink-0 cursor-pointer rounded-md px-1 py-0.5 transition-colors hover:text-teal-800 dark:hover:text-teal-300"
        >
          پراسپکت ۲
        </button>

        {/* Zone 2: 5 concise single-line navigation links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const active =
              currentView === item.id || (currentView === 'lesson' && item.id === 'home');
            return (
              <button
                key={item.id}
                type="button"
                data-tv-focusable="true"
                onClick={() => onNavigate(item.id)}
                className={`whitespace-nowrap shrink-0 cursor-pointer py-1 transition-colors border-b-2 ${
                  active
                    ? 'border-teal-600 text-teal-700 dark:border-teal-400 dark:text-teal-300 font-semibold'
                    : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            data-tv-focusable="true"
            onClick={onOpenTutor}
            className="whitespace-nowrap shrink-0 cursor-pointer rounded-lg bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            معلم هوشمند
          </button>
        </div>
      </div>

      {/* Mobile / narrow TV fallback nav strip */}
      <nav className="flex lg:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 dark:border-slate-800/80 px-4 py-2 text-xs font-medium">
        {NAV_ITEMS.map((item) => {
          const active =
            currentView === item.id || (currentView === 'lesson' && item.id === 'home');
          return (
            <button
              key={item.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => onNavigate(item.id)}
              className={`whitespace-nowrap shrink-0 px-2 py-1 rounded-md transition-colors ${
                active
                  ? 'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-semibold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
