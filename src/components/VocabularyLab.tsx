import { VocabPicture } from './VocabPicture';
import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, RotateCcw, Search, Volume2, XCircle } from 'lucide-react';
import { PROSPECT2_VOCAB } from '../data/prospect2';
import { StudentProgress, VocabItem } from '../types/curriculum';
import { getDueVocabIds, getWeakVocabIds } from '../utils/storage';
import { playFeedbackTone, speakEnglish } from '../utils/audioEngine';

interface VocabularyLabProps {
  progress: StudentProgress;
  onRecordAttempt: (vocabId: string, isCorrect: boolean) => void;
}

type LabTab = 'dictionary' | 'srs-quiz' | 'photo-dict';
type QuizDirection = 'en-to-fa' | 'fa-to-en';

export const VocabularyLab: React.FC<VocabularyLabProps> = ({ progress, onRecordAttempt }) => {
  const [tab, setTab] = useState<LabTab>('dictionary');
  const [lessonFilter, setLessonFilter] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  // SRS / Bidirectional Quiz state
  const [quizDirection, setQuizDirection] = useState<QuizDirection>('en-to-fa');
  const [quizMode, setQuizMode] = useState<'weak-due' | 'random'>('weak-due');
  const [qIndex, setQIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredVocab = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return PROSPECT2_VOCAB.filter((item) => {
      if (tab === 'photo-dict' && !item.inPhotoDictionary) return false;
      if (lessonFilter !== 0 && item.lessonId !== lessonFilter) return false;
      if (!q) return true;
      return (
        item.en.toLowerCase().includes(q) ||
        item.fa.includes(q) ||
        item.category.includes(q)
      );
    });
  }, [tab, lessonFilter, searchQuery]);

  const weakIds = useMemo(() => getWeakVocabIds(progress.vocabSRS), [progress.vocabSRS]);
  const dueIds = useMemo(() => getDueVocabIds(progress.vocabSRS), [progress.vocabSRS]);

  const quizPool: VocabItem[] = useMemo(() => {
    if (quizMode === 'weak-due') {
      const priorityIds = Array.from(new Set([...weakIds, ...dueIds]));
      const items = priorityIds
        .map((id) => PROSPECT2_VOCAB.find((v) => v.id === id))
        .filter((v): v is VocabItem => Boolean(v));
      return items.length > 0 ? items : PROSPECT2_VOCAB;
    }
    // Deterministic shuffled order based on index seed
    return [...PROSPECT2_VOCAB].sort((a, b) => a.en.localeCompare(b.en));
  }, [quizMode, weakIds, dueIds]);

  const activeWord = quizPool[qIndex % Math.max(1, quizPool.length)];

  const quizOptions = useMemo(() => {
    if (!activeWord) return [];
    const others = PROSPECT2_VOCAB.filter((v) => v.id !== activeWord.id);
    const step = Math.max(1, Math.floor(others.length / 4));
    const picks = [
      others[(qIndex * 3) % others.length],
      others[(qIndex * 3 + step) % others.length],
      others[(qIndex * 3 + step * 2) % others.length],
    ];
    const combined = [activeWord, ...picks];
    const rot = qIndex % combined.length;
    return [...combined.slice(rot), ...combined.slice(0, rot)];
  }, [activeWord, qIndex]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            آموزش واژگان، دیکشنری هوشمند و تکرار فاصله‌دار
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            تمامی لغات دروس ۱ تا ۷ و دیکشنری با تصویرسازی آموزشی آفلاین همراه با تلفظ صوتی و شناسایی لغات فراموش‌شده.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800">
          {[
            { id: 'dictionary' as LabTab, label: 'دیکشنری هوشمند' },
            { id: 'srs-quiz' as LabTab, label: `آزمون و مرور هوشمند (${weakIds.length} ضعیف)` },
            { id: 'photo-dict' as LabTab, label: 'دیکشنری تصویری آفلاین' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TAB 1 & 3: DICTIONARY & PHOTO DICTIONARY ================= */}
      {(tab === 'dictionary' || tab === 'photo-dict') && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="h-4 w-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی کلمه انگلیسی یا معنی فارسی..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pr-10 pl-4 py-2.5 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((lId) => (
                <button
                  key={lId}
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => setLessonFilter(lId)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer border transition-colors ${
                    lessonFilter === lId
                      ? 'border-teal-600 bg-teal-700 text-white'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {lId === 0 ? 'همه درس‌ها' : `درس ${lId}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredVocab.map((item) => {
              const srs = progress.vocabSRS[item.id];
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
                >
                  {tab === 'photo-dict' && <VocabPicture item={item} />}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>
                        درس {item.lessonId} · {item.category}
                      </span>
                      <span>{item.pageRef}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-en text-xl font-bold text-slate-900 dark:text-white">
                        {item.en}
                      </h3>
                      <button
                        type="button"
                        data-tv-focusable="true"
                        onClick={() => speakEnglish({ text: item.en, rate: progress.speechRate })}
                        className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/50 p-2.5 text-teal-700 dark:text-teal-300 cursor-pointer shrink-0"
                        aria-label={`پخش تلفظ ${item.en}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="font-ipa text-xs text-slate-500 dark:text-slate-400">{item.ipa}</p>
                    <p className="text-base font-bold text-teal-700 dark:text-teal-400">{item.fa}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                    <p className="font-en text-xs text-slate-700 dark:text-slate-300">{item.exampleEn}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{item.exampleFa}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 tabular-nums pt-1">
                      تسلط لایتنر: جعبه {srs?.box ?? 1} از ۵
                      {srs?.wrongCount ? ` · ${srs.wrongCount} خطا` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredVocab.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-slate-500">
              <BookOpen className="h-10 w-10 mx-auto mb-2 text-slate-400" />
              <p>لغتی با این فیلتر پیدا نشد.</p>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: SMART BIDIRECTIONAL & SRS QUIZ ================= */}
      {tab === 'srs-quiz' && activeWord && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 lg:p-8 space-y-6 max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  setQuizMode('weak-due');
                  setQIndex(0);
                  setSelectedId(null);
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer ${
                  quizMode === 'weak-due'
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                تکرار هوشمند لغات ضعیف/مروری
              </button>
              <button
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  setQuizMode('random');
                  setQIndex(0);
                  setSelectedId(null);
                }}
                className={`rounded-lg px-3.5 py-2 text-xs font-bold cursor-pointer ${
                  quizMode === 'random'
                    ? 'bg-teal-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                آزمون دوره‌ای کل کتاب
              </button>
            </div>

            <button
              type="button"
              data-tv-focusable="true"
              onClick={() => {
                setQuizDirection((d) => (d === 'en-to-fa' ? 'fa-to-en' : 'en-to-fa'));
                setSelectedId(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>
                جهت پرسش: {quizDirection === 'en-to-fa' ? 'انگلیسی ← فارسی' : 'فارسی ← انگلیسی'}
              </span>
            </button>
          </div>

          <div className="space-y-3 text-center py-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              درس {activeWord.lessonId} · {activeWord.category} · جعبه لایتنر{' '}
              {progress.vocabSRS[activeWord.id]?.box ?? 1}/۵
            </p>

            {quizDirection === 'en-to-fa' ? (
              <div className="flex items-center justify-center gap-3">
                <h2 className="font-en text-3xl font-extrabold text-slate-900 dark:text-white">
                  {activeWord.en}
                </h2>
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => speakEnglish({ text: activeWord.en, rate: progress.speechRate })}
                  className="rounded-xl bg-teal-50 dark:bg-teal-950 p-3 text-teal-700 dark:text-teal-300 cursor-pointer"
                  aria-label="پخش تلفظ کلمه"
                >
                  <Volume2 className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {activeWord.fa}
              </h2>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quizOptions.map((opt) => {
              const answered = selectedId !== null;
              const isCorrect = opt.id === activeWord.id;
              const isChosen = selectedId === opt.id;

              let cls =
                'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:border-teal-500 text-slate-900 dark:text-white';
              if (answered && isCorrect) {
                cls =
                  'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
              } else if (answered && isChosen && !isCorrect) {
                cls =
                  'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={answered}
                  data-tv-focusable="true"
                  onClick={() => {
                    setSelectedId(opt.id);
                    const ok = opt.id === activeWord.id;
                    playFeedbackTone(ok ? 'correct' : 'wrong', progress.soundEffects);
                    onRecordAttempt(activeWord.id, ok);
                  }}
                  className={`rounded-xl border p-4 text-sm sm:text-base font-bold cursor-pointer transition-colors ${
                    quizDirection === 'fa-to-en' ? 'font-en text-center' : 'text-right'
                  } ${cls}`}
                >
                  {quizDirection === 'en-to-fa' ? opt.fa : opt.en}
                </button>
              );
            })}
          </div>

          {selectedId !== null && (
            <div className="space-y-4">
              <div
                className={`rounded-xl border p-4 text-sm space-y-1.5 ${
                  selectedId === activeWord.id
                    ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                    : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {selectedId === activeWord.id ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}
                  <span>
                    {selectedId === activeWord.id
                      ? 'عالی! این لغت به جعبه بالاتر لایتنر رفت.'
                      : `پاسخ صحیح: ${activeWord.en} = ${activeWord.fa}`}
                  </span>
                </div>
                <p className="font-en text-xs pt-1">{activeWord.exampleEn}</p>
                <p className="text-xs opacity-90">{activeWord.exampleFa}</p>
              </div>

              <button
                type="button"
                data-tv-focusable="true"
                onClick={() => {
                  setQIndex((i) => i + 1);
                  setSelectedId(null);
                }}
                className="w-full rounded-xl bg-teal-700 hover:bg-teal-800 py-3 text-sm font-bold text-white cursor-pointer"
              >
                کلمه بعدی
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
