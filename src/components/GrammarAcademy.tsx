import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { ALL_LESSONS } from '../data/prospect2';
import { QuizQuestion, StudentProgress } from '../types/curriculum';
import { playFeedbackTone, speakEnglish } from '../utils/audioEngine';

interface GrammarAcademyProps {
  progress: StudentProgress;
  onRecordQuizAnswer: (question: QuizQuestion, isCorrect: boolean) => void;
}

export const GrammarAcademy: React.FC<GrammarAcademyProps> = ({
  progress,
  onRecordQuizAnswer,
}) => {
  const grammarLessons = ALL_LESSONS.filter((l) => l.grammar.length > 0);
  const [selectedLessonId, setSelectedLessonId] = useState<number>(grammarLessons[0]?.id ?? 1);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const activeLesson =
    grammarLessons.find((l) => l.id === selectedLessonId) ?? grammarLessons[0];

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5 space-y-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            آموزش جامع گرامر کتاب پراسپکت ۲ (گام‌به‌گام با مثال‌های بیشتر)
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            تمامی قواعد کلیدی درس‌های ۱ تا ۷ به زبان ساده، همراه با تذکر اشتباهات رایج و تمرین توضیح‌دار.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {grammarLessons.map((l) => (
            <button
              key={l.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => setSelectedLessonId(l.id)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold border transition-colors cursor-pointer ${
                selectedLessonId === l.id
                  ? 'border-teal-600 bg-teal-700 text-white'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
              }`}
            >
              {l.titleFa}
            </button>
          ))}
        </div>
      </div>

      {activeLesson.grammar.map((g) => (
        <div
          key={g.id}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
        >
          <div className="space-y-2">
            <p className="font-en text-xs font-semibold text-teal-700 dark:text-teal-400">
              {g.titleEn}
            </p>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{g.titleFa}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {g.summaryFa}
            </p>
          </div>

          <div className="rounded-xl bg-slate-900 dark:bg-slate-950 text-amber-300 p-4 font-ipa text-sm text-center">
            {g.formula}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                توضیح مرحله‌به‌مرحله:
              </h3>
              <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {g.stepsFa.map((s, idx) => (
                  <li key={idx} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3">
                    {s}
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                <h3 className="text-sm font-bold text-teal-700 dark:text-teal-400">
                  مثال‌های کتاب و مثال‌های بیشتر
                </h3>
                {[...g.bookExamples, ...g.extraExamples].map((ex, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 border-b last:border-b-0 border-slate-100 dark:border-slate-800 pb-2 last:pb-0">
                    <div>
                      <p className="font-en text-sm font-semibold text-slate-900 dark:text-white">
                        {ex.en}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ex.fa}</p>
                    </div>
                    <button
                      type="button"
                      data-tv-focusable="true"
                      onClick={() => speakEnglish({ text: ex.en, rate: progress.speechRate })}
                      className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer shrink-0"
                      aria-label="پخش جمله"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/70 dark:bg-rose-950/30 p-4 space-y-1 text-xs">
                <p className="font-bold text-rose-800 dark:text-rose-300">اشتباه رایج:</p>
                <p className="font-en text-rose-700 dark:text-rose-300">✗ {g.commonMistakeFa.wrong}</p>
                <p className="font-en font-bold text-emerald-700 dark:text-emerald-300">✓ {g.commonMistakeFa.right}</p>
                <p className="text-slate-700 dark:text-slate-300">{g.commonMistakeFa.reasonFa}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              تمرین تثبیت گرامر:
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {g.practiceQuestions.map((pq) => {
                const chosen = answers[pq.id];
                const answered = chosen !== undefined;
                const ok = chosen === pq.correctIndex;

                return (
                  <div
                    key={pq.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                  >
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{pq.promptFa}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {pq.options.map((opt, idx) => {
                        let cls =
                          'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40';
                        if (answered && idx === pq.correctIndex) {
                          cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50';
                        } else if (answered && idx === chosen && !ok) {
                          cls = 'border-rose-500 bg-rose-50 dark:bg-rose-950/50';
                        }
                        return (
                          <button
                            key={idx}
                            type="button"
                            data-tv-focusable="true"
                            onClick={() => {
                              const right = idx === pq.correctIndex;
                              playFeedbackTone(right ? 'correct' : 'wrong', progress.soundEffects);
                              setAnswers((prev) => ({ ...prev, [pq.id]: idx }));
                              onRecordQuizAnswer(pq, right);
                            }}
                            className={`font-en text-left rounded-lg border px-3 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer ${cls}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                    {answered && (
                      <p
                        className={`text-xs ${
                          ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {ok ? pq.explanationRightFa : pq.explanationWrongFa}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
