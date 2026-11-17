import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Moon,
  Play,
  RotateCcw,
  Sun,
  Volume2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { ALL_LESSONS, TEXTBOOK_META, PROSPECT2_VOCAB } from '../data/prospect2';
import { AppView, LessonStage, StudentProgress } from '../types/curriculum';
import { getDueVocabIds, getWeakVocabIds } from '../utils/storage';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface HomeHubProps {
  progress: StudentProgress;
  onOpenLesson: (lessonId: number, stage?: LessonStage) => void;
  onNavigate: (view: AppView) => void;
  onToggleDark: () => void;
  onToggleSpeechRate: () => void;
}

const STAGE_LABELS: Record<LessonStage, string> = {
  conversation: 'مکالمه و خواندن همزمان',
  vocabulary: 'واژگان و دیکشنری',
  grammar: 'گرامر گام‌به‌گام',
  phonics: 'تلفظ و املا',
  exercises: 'حل تمرین کتاب',
  quiz: 'آزمون پایان درس',
};

export const HomeHub: React.FC<HomeHubProps> = ({
  progress,
  onOpenLesson,
  onNavigate,
  onToggleDark,
  onToggleSpeechRate,
}) => {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [heroImgError, setHeroImgError] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  const lastLesson =
    ALL_LESSONS.find((l) => l.id === progress.lastLessonId) ?? ALL_LESSONS[0];

  const masteredVocabCount = Object.values(progress.vocabSRS).filter((s) => s.box >= 4).length;
  const weakVocabCount = getWeakVocabIds(progress.vocabSRS).length;
  const dueVocabCount = getDueVocabIds(progress.vocabSRS).length;

  const totalStagesPossible = ALL_LESSONS.reduce(
    (acc, l) => acc + (l.isReview ? 3 : 6),
    0
  );
  const completedStagesCount = Object.values(progress.completedStages).reduce(
    (acc, arr) => acc + arr.length,
    0
  );
  const bookProgressPct = Math.min(
    100,
    Math.round((completedStagesCount / Math.max(1, totalStagesPossible)) * 100)
  );

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-8">
      {/* Workspace Utility Toolbar (TV Settings & Offline PWA Install) */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {TEXTBOOK_META.gradeFa}
          </span>
          <span aria-hidden="true">·</span>
          <span>{TEXTBOOK_META.bookCode}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>آنلاین · تلفظ آفلاین آماده است</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>حالت آفلاین (کل کتاب در دسترس)</span>
              </>
            )}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-tv-focusable="true"
            onClick={onToggleSpeechRate}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span>سرعت تلفظ: {progress.speechRate < 0.85 ? 'آهسته (۰.۷۵x)' : 'عادی (۱x)'}</span>
          </button>

          <button
            type="button"
            data-tv-focusable="true"
            onClick={onToggleDark}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {progress.darkMode ? (
              <>
                <Sun className="h-4 w-4 text-amber-500" />
                <span>حالت روز</span>
              </>
            ) : (
              <>
                <Moon className="h-4 w-4 text-slate-600" />
                <span>حالت تلویزیون (شب)</span>
              </>
            )}
          </button>

          <button
            type="button"
            data-tv-focusable="true"
            onClick={() => onNavigate('blueprint')}
            className="inline-flex items-center gap-2 rounded-lg border border-teal-300 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 px-3.5 py-2 text-xs font-semibold text-teal-800 dark:text-teal-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-4 w-4" />
            <span>خروجی و ساخت APK</span>
          </button>

          {!isInstalled && isInstallable && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={install}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>نصب نسخه آفلاین (PWA)</span>
            </button>
          )}

          {!isInstalled && isIOS && (
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => setShowIOSModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>راهنمای نصب iOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Hero Split Section (Resume Study + Custom Classroom Visual) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:p-8">
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <p className="text-xs font-medium text-teal-700 dark:text-teal-400">
              {TEXTBOOK_META.titleEn} · {TEXTBOOK_META.edition}
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-slate-900 dark:text-white [text-wrap:balance]">
              معلم هوشمند و تعاملی انگلیسی پایه هشتم ویژه تلویزیون اندرویدی
            </h1>
            <p className="text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
              آموزش کامل و مرحله‌به‌مرحله هر ۷ درس کتاب پراسپکت ۲ با تلفظ صوتی و هایلایت همزمان کلمات،
              گرامر ساده همراه با مثال‌های بیشتر، حل گام‌به‌گام تمرین‌ها و جدول کتاب، و مرور هوشمند لغات فراموش‌شده.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => onOpenLesson(lastLesson.id, progress.lastStage)}
              className="resume-lesson inline-flex items-center gap-3 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 px-6 py-3.5 text-base font-bold text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Play className="h-5 w-5 fill-current" />
              <span>
                ادامه از {lastLesson.titleFa} ({STAGE_LABELS[progress.lastStage]})
              </span>
            </button>

            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => onNavigate('vocabulary')}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 px-5 py-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>مرور واژگان ({dueVocabCount} آماده تمرین)</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          {!heroImgError ? (
            <img
              src="/src/assets/images/hero_prospect_tv_classroom_1794855364370.jpg"
              alt="محیط آموزش هوشمند کتاب انگلیسی پایه هشتم روی تلویزیون اندرویدی"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-64 lg:h-full max-h-[340px] object-cover rounded-xl border border-slate-200 dark:border-slate-800"
            />
          ) : (
            <div className="flex h-64 lg:h-full items-center justify-center rounded-xl bg-gradient-to-br from-teal-700 to-slate-900 p-8 text-white">
              <div className="text-center space-y-2">
                <BookOpen className="h-12 w-12 mx-auto text-amber-400" />
                <p className="font-bold text-lg">Prospect 2 Smart TV Classroom</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 4-Column KPI Progress Strip below Hero */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">پیشرفت کل کتاب درسی</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {bookProgressPct}٪
          </p>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300"
              style={{ width: `${bookProgressPct}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">واژگان تثبیت‌شده (جعبه ۴ و ۵)</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {masteredVocabCount} <span className="text-sm font-normal text-slate-500">/ {PROSPECT2_VOCAB.length}</span>
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">شامل دیکشنری تصویری کتاب</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">نیازمند مرور و تقویت</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {weakVocabCount} واژه
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">تکرار خودکار لایتنر</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">امتیاز و استمرار روزانه</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-700 dark:text-teal-400 tabular-nums">
            {progress.xp} XP
          </p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            {progress.streakDays} روز مطالعه متوالی
          </p>
        </div>
      </section>

      {/* TV Remote Control Shortcut Footer */}
      <footer className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 dark:text-slate-300">راهنمای کنترل تلویزیون (Android TV):</span>
          <span>جهت‌ها: جابجایی بین کارت‌ها</span>
          <span aria-hidden="true">·</span>
          <span>OK / Enter: انتخاب و پخش</span>
          <span aria-hidden="true">·</span>
          <span>Back / Esc: بازگشت</span>
        </div>
        <span>ذخیره‌سازی خودکار پیشرفت روی حافظه دستگاه فعال است</span>
      </footer>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">نصب برنامه روی iOS</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              ۱. دکمه Share در نوار ابزار Safari را بزنید.
              <br />
              ۲. گزینه Add to Home Screen را انتخاب کنید تا نسخه آفلاین نصب شود.
            </p>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full rounded-xl bg-teal-700 py-2.5 text-sm font-semibold text-white cursor-pointer"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
