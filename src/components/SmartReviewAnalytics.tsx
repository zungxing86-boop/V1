import React from 'react';
import { AlertTriangle, Award, BarChart3, CheckCircle2, Play, RotateCcw } from 'lucide-react';
import { ALL_LESSONS, PROSPECT2_VOCAB } from '../data/prospect2';
import { LessonStage, StudentProgress } from '../types/curriculum';
import { getWeakVocabIds } from '../utils/storage';

interface SmartReviewAnalyticsProps {
  progress: StudentProgress;
  onOpenLesson: (lessonId: number, stage?: LessonStage) => void;
  onGoToVocabReview: () => void;
  onResetProgress: () => void;
}

export const SmartReviewAnalytics: React.FC<SmartReviewAnalyticsProps> = ({
  progress,
  onOpenLesson,
  onGoToVocabReview,
  onResetProgress,
}) => {
  const weakVocabIds = getWeakVocabIds(progress.vocabSRS);
  const weakVocabItems = weakVocabIds
    .map((id) => PROSPECT2_VOCAB.find((v) => v.id === id))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));

  const weakQuestions = Object.entries(progress.weakGrammarIds)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([qId, count]) => {
      for (const lesson of ALL_LESSONS) {
        const fromQuiz = lesson.quiz.find((q) => q.id === qId);
        if (fromQuiz) return { question: fromQuiz, lesson, count };
        for (const g of lesson.grammar) {
          const fromGrammar = g.practiceQuestions.find((q) => q.id === qId);
          if (fromGrammar) return { question: fromGrammar, lesson, count };
        }
      }
      return null;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  const totalAnswered = progress.totalCorrect + progress.totalWrong;
  const accuracyPct =
    totalAnswered > 0 ? Math.round((progress.totalCorrect / totalAnswered) * 100) : 100;

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            سیستم مرور هوشمند و کارنامه یادگیری
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            تحلیل میزان تسلط در هر درس، ثبت پاسخ‌های صحیح و غلط، و پیشنهاد تمرین تقویتی روی نقاط ضعف.
          </p>
        </div>

        <button
          type="button"
          data-tv-focusable="true"
          onClick={onResetProgress}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900 px-4 py-2 text-xs font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>شروع مجدد کارنامه دستگاه</span>
        </button>
      </div>

      {/* Top Report KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">دقت پاسخگویی</p>
          <p className="mt-2 text-2xl font-extrabold text-teal-700 dark:text-teal-400 tabular-nums">
            {accuracyPct}٪
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {progress.totalCorrect} درست · {progress.totalWrong} غلط
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">تمرین‌های حل‌شده کتاب</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {progress.solvedExerciseIds.length} مورد
          </p>
          <p className="mt-1 text-xs text-slate-500">با راهنمای گام‌به‌گام</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">لغات نیازمند تکرار</p>
          <p className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {weakVocabItems.length} واژه
          </p>
          <p className="mt-1 text-xs text-slate-500">اولویت‌دار در لایتنر</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400">امتیاز کل دانش‌آموز</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {progress.xp} XP
          </p>
          <p className="mt-1 text-xs text-slate-500 tabular-nums">
            {progress.streakDays} روز مطالعه متوالی
          </p>
        </div>
      </div>

      {/* Weak Spots Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Vocabulary */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <span>واژگان فراموش‌شده و نیازمند مرور</span>
            </h2>
            <button
              type="button"
              data-tv-focusable="true"
              onClick={onGoToVocabReview}
              className="rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              شروع مرور هوشمند واژگان
            </button>
          </div>

          {weakVocabItems.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {weakVocabItems.slice(0, 6).map((item) => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-en text-sm font-bold text-slate-900 dark:text-white">
                      {item.en}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.fa}</p>
                  </div>
                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {progress.vocabSRS[item.id]?.wrongCount ?? 0} خطا · درس {item.lessonId}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-5 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>در حال حاضر لغت ضعیفی ثبت نشده است! می‌توانید آزمون دوره‌ای واژگان را انجام دهید.</span>
            </div>
          )}
        </div>

        {/* Weak Grammar / Exam Topics */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-teal-600" />
            <span>نقاط ضعف گرامری و پیشنهادی</span>
          </h2>

          {weakQuestions.length > 0 ? (
            <div className="space-y-3">
              {weakQuestions.slice(0, 5).map(({ question, lesson, count }) => (
                <div
                  key={question.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {lesson.titleFa} · تکرار خطا: {count} بار
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {question.reTeachTopicFa}
                    </p>
                  </div>
                  <button
                    type="button"
                    data-tv-focusable="true"
                    onClick={() =>
                      onOpenLesson(
                        lesson.id,
                        question.skill === 'phonics' ? 'phonics' : 'grammar'
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-bold text-white cursor-pointer shrink-0"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>تمرین مجدد</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-5 text-sm text-slate-600 dark:text-slate-300">
              هنوز نقطه ضعفی در بخش گرامر و آزمون‌ها ثبت نشده است. با شرکت در آزمون هر درس، سیستم به صورت خودکار مباحث نیازمند تمرین بیشتر را اینجا پیشنهاد می‌دهد.
            </div>
          )}
        </div>
      </div>

      {/* Per-Lesson Mastery Breakdown */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <span>پیشرفت به تفکیک درس‌های کتاب</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_LESSONS.map((lesson) => {
            const done = progress.completedStages[String(lesson.id)] ?? [];
            const total = lesson.isReview ? 3 : 6;
            const pct = Math.min(100, Math.round((done.length / total) * 100));
            const exam = progress.lessonQuizScores[lesson.id];

            return (
              <div
                key={lesson.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {lesson.titleFa}
                    </span>
                    <span className="text-xs font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                      {pct}٪
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-teal-600" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {exam
                      ? `بهترین نمره آزمون: ${exam.bestScore} از ${exam.total} (${exam.attempts} تلاش)`
                      : 'آزمون پایان درس هنوز انجام نشده'}
                  </p>
                </div>

                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => onOpenLesson(lesson.id, 'quiz')}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer shrink-0"
                >
                  ورود
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
