import { BookOpen, CheckCircle2, ChevronLeft, Layers } from 'lucide-react';
import { ALL_LESSONS } from '../data/prospect2';
import type { StudentProgress } from '../types/curriculum';

export function LessonSidebar({ progress, activeId, onOpen }: {
  progress: StudentProgress;
  activeId?: number;
  onOpen: (id: number) => void;
}) {
  return (
    <aside className="lesson-sidebar" aria-label="فهرست درس‌ها">
      <div className="lesson-sidebar-heading">
        <span className="lesson-sidebar-emblem"><BookOpen size={23} /></span>
        <div><h2>مسیر یادگیری</h2><p>پراسپکت ۲ · هفتمین قدم تا تسلط</p></div>
      </div>
      <nav className="lesson-sidebar-list" aria-label="درس‌ها و مرورها">
        {ALL_LESSONS.map(lesson => {
          const count = (progress.completedStages[String(lesson.id)] ?? []).length;
          const pct = Math.min(100, Math.round(count / (lesson.isReview ? 3 : 6) * 100));
          return (
            <button key={lesson.id} type="button" data-tv-focusable="true"
              aria-current={activeId === lesson.id ? 'page' : undefined}
              onClick={() => onOpen(lesson.id)}
              className={`lesson-nav-card ${lesson.isReview ? 'lesson-nav-review' : ''} ${activeId === lesson.id ? 'is-active' : ''}`}>
              <span className="lesson-nav-badge" aria-hidden="true">
                {pct === 100 ? <CheckCircle2 size={22} /> : lesson.isReview ? <Layers size={21} /> : lesson.code.replace(/\D/g, '')}
              </span>
              <span className="lesson-nav-label">
                <span className="lesson-nav-title">{lesson.titleFa}</span>
                <span className="lesson-nav-english" lang="en" dir="ltr">{lesson.titleEn}</span>
                <span className="lesson-nav-progress" aria-label={`${pct} درصد تکمیل شده`}><span style={{width: `${pct}%`}} /></span>
              </span>
              <ChevronLeft size={17} className="lesson-nav-arrow" aria-hidden="true" />
            </button>
          );
        })}
      </nav>
      <p className="lesson-sidebar-help">↑ ↓ انتخاب درس · OK ورود به کلاس</p>
    </aside>
  );
}
