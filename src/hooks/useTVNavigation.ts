import { useEffect } from 'react';

/**
 * Spatial D-Pad / Arrow Key navigation for Android TV remotes and keyboards.
 * Moves focus geometrically between elements marked with data-tv-focusable="true".
 */
export function useTVNavigation(onBack?: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if (e.key === 'Escape' || (e.key === 'Backspace' && !isInput)) {
        if (onBack) {
          e.preventDefault();
          onBack();
        }
        return;
      }

      if (isInput && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        return;
      }

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        return;
      }

      const focusables = Array.from(
        document.querySelectorAll<HTMLElement>('[data-tv-focusable="true"]:not([disabled])')
      ).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== 'hidden';
      });

      if (focusables.length === 0) return;

      const active = document.activeElement as HTMLElement | null;
      const currentIdx = active ? focusables.indexOf(active) : -1;

      if (currentIdx === -1) {
        e.preventDefault();
        focusables[0].focus();
        focusables[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }

      const currentRect = focusables[currentIdx].getBoundingClientRect();
      const cx = currentRect.left + currentRect.width / 2;
      const cy = currentRect.top + currentRect.height / 2;

      let bestEl: HTMLElement | null = null;
      let bestScore = Infinity;

      for (const el of focusables) {
        if (el === focusables[currentIdx]) continue;
        const r = el.getBoundingClientRect();
        const ex = r.left + r.width / 2;
        const ey = r.top + r.height / 2;
        const dx = ex - cx;
        const dy = ey - cy;

        let valid = false;
        let primaryDist = 0;
        let crossDist = 0;

        if (e.key === 'ArrowRight' && dx > 12) {
          valid = true;
          primaryDist = dx;
          crossDist = Math.abs(dy);
        } else if (e.key === 'ArrowLeft' && dx < -12) {
          valid = true;
          primaryDist = -dx;
          crossDist = Math.abs(dy);
        } else if (e.key === 'ArrowDown' && dy > 12) {
          valid = true;
          primaryDist = dy;
          crossDist = Math.abs(dx);
        } else if (e.key === 'ArrowUp' && dy < -12) {
          valid = true;
          primaryDist = -dy;
          crossDist = Math.abs(dx);
        }

        if (!valid) continue;

        const score = primaryDist + crossDist * 2.2;
        if (score < bestScore) {
          bestScore = score;
          bestEl = el;
        }
      }

      if (bestEl) {
        e.preventDefault();
        bestEl.focus();
        bestEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack]);
}
