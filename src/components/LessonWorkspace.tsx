import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronLeft,
  HelpCircle,
  Lightbulb,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Square,
  Volume2,
  XCircle,
} from 'lucide-react';
import { LessonData, LessonStage, QuizQuestion, StudentProgress } from '../types/curriculum';
import { PROSPECT2_VOCAB } from '../data/prospect2';
import { playFeedbackTone, speakEnglish, stopSpeaking } from '../utils/audioEngine';

interface LessonWorkspaceProps {
  lesson: LessonData;
  initialStage: LessonStage;
  progress: StudentProgress;
  onStageChange: (stage: LessonStage) => void;
  onCompleteStage: (lessonId: number, stage: LessonStage) => void;
  onRecordVocabAttempt: (vocabId: string, isCorrect: boolean) => void;
  onRecordQuizAnswer: (question: QuizQuestion, isCorrect: boolean) => void;
  onSaveLessonExam: (lessonId: number, score: number, total: number) => void;
  onMarkExerciseSolved: (exerciseId: string) => void;
  onBackHome: () => void;
  onAskTutor: (prefill: string) => void;
}

const ALL_STAGES: { id: LessonStage; label: string }[] = [
  { id: 'conversation', label: '۱. مکالمه و خواندن همزمان' },
  { id: 'vocabulary', label: '۲. واژگان درس' },
  { id: 'grammar', label: '۳. گرامر گام‌به‌گام' },
  { id: 'phonics', label: '۴. تلفظ و املا' },
  { id: 'exercises', label: '۵. حل تمرین کتاب' },
  { id: 'quiz', label: '۶. آزمون جامع درس' },
];

export const LessonWorkspace: React.FC<LessonWorkspaceProps> = ({
  lesson,
  initialStage,
  progress,
  onStageChange,
  onCompleteStage,
  onRecordVocabAttempt,
  onRecordQuizAnswer,
  onSaveLessonExam,
  onMarkExerciseSolved,
  onBackHome,
  onAskTutor,
}) => {
  const availableStages = lesson.isReview
    ? ALL_STAGES.filter((s) => ['conversation', 'phonics', 'exercises', 'quiz'].includes(s.id))
    : ALL_STAGES;

  const [stage, setStage] = useState<LessonStage>(
    availableStages.some((s) => s.id === initialStage) ? initialStage : 'conversation'
  );
  const [showPersian, setShowPersian] = useState(true);
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [activeWordIdx, setActiveWordIdx] = useState<number>(-1);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const playAllAbortRef = useRef(false);

  // Pronunciation practice state
  const [listeningLineId, setListeningLineId] = useState<string | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechNotice, setSpeechNotice] = useState<string>('');

  // Lesson vocab mini-quiz state
  const lessonVocab = PROSPECT2_VOCAB.filter((v) => v.lessonId === lesson.id);
  const [vocabQuizIdx, setVocabQuizIdx] = useState(0);
  const [vocabQuizFeedback, setVocabQuizFeedback] = useState<{
    correct: boolean;
    message: string;
  } | null>(null);

  // Grammar practice state
  const [grammarAnswers, setGrammarAnswers] = useState<Record<string, number>>({});

  // Guided exercise state
  const [exerciseInputs, setExerciseInputs] = useState<Record<string, string>>({});
  const [exerciseHintsUsed, setExerciseHintsUsed] = useState<Record<string, number>>({});
  const [exerciseStatus, setExerciseStatus] = useState<
    Record<string, 'idle' | 'correct' | 'wrong' | 'revealed'>
  >({});

  // End-of-lesson exam state
  const [examIdx, setExamIdx] = useState(0);
  const [examSelected, setExamSelected] = useState<number | null>(null);
  const [examScore, setExamScore] = useState(0);
  const [examFinished, setExamFinished] = useState(false);

  useEffect(() => {
    setStage(availableStages.some((s) => s.id === initialStage) ? initialStage : 'conversation');
    setExamIdx(0);
    setExamSelected(null);
    setExamScore(0);
    setExamFinished(false);
    setVocabQuizIdx(0);
    setVocabQuizFeedback(null);
    stopSpeaking();
    playAllAbortRef.current = true;
    setIsPlayingAll(false);
    setActiveLineId(null);
    setActiveWordIdx(-1);
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      playAllAbortRef.current = true;
      stopSpeaking();
    };
  }, []);

  const switchStage = (next: LessonStage) => {
    playAllAbortRef.current = true;
    stopSpeaking();
    setIsPlayingAll(false);
    setActiveLineId(null);
    setActiveWordIdx(-1);
    setStage(next);
    onStageChange(next);
  };

  const handlePlayLine = async (lineId: string, text: string) => {
    playAllAbortRef.current = true;
    setIsPlayingAll(false);
    setActiveLineId(lineId);
    setActiveWordIdx(0);
    await speakEnglish({
      text,
      rate: progress.speechRate,
      onWordIndex: (idx) => setActiveWordIdx(idx),
      onEnd: () => {
        setActiveLineId(null);
        setActiveWordIdx(-1);
      },
    });
  };

  const handlePlayAllConversation = async () => {
    if (isPlayingAll) {
      playAllAbortRef.current = true;
      stopSpeaking();
      setIsPlayingAll(false);
      setActiveLineId(null);
      setActiveWordIdx(-1);
      return;
    }

    playAllAbortRef.current = false;
    setIsPlayingAll(true);

    for (const line of lesson.conversation) {
      if (playAllAbortRef.current) break;
      setActiveLineId(line.id);
      setActiveWordIdx(0);
      await speakEnglish({
        text: line.en,
        rate: progress.speechRate,
        onWordIndex: (idx) => setActiveWordIdx(idx),
      });
      if (playAllAbortRef.current) break;
      await new Promise((r) => setTimeout(r, 320));
    }

    setIsPlayingAll(false);
    setActiveLineId(null);
    setActiveWordIdx(-1);
  };

  const handlePracticeSpeech = (lineId: string, targetText: string) => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => unknown }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setListeningLineId(lineId);
      setSpeechTranscript('');
      setSpeechNotice(
        'میکروفون یا تشخیص گفتار روی این مرورگر/تلویزیون فعال نیست؛ ابتدا به صدای جمله گوش دهید و همزمان با هایلایت کلمات بلند تکرار کنید.'
      );
      handlePlayLine(lineId, targetText);
      return;
    }

    try {
      const rec = new SpeechRec() as {
        lang: string;
        interimResults: boolean;
        maxAlternatives: number;
        onresult: (ev: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      rec.lang = 'en-US';
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      setListeningLineId(lineId);
      setSpeechTranscript('');
      setSpeechNotice('در حال شنیدن صدای شما... جمله انگلیسی را بخوانید.');

      rec.onresult = (event) => {
        const spoken = event.results[0]?.[0]?.transcript || '';
        setSpeechTranscript(spoken);
        const normTarget = targetText.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        const normSpoken = spoken.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/);
        const matched = normTarget.filter((w) => normSpoken.includes(w)).length;
        const pct = Math.round((matched / Math.max(1, normTarget.length)) * 100);
        setSpeechNotice(
          pct >= 65
            ? `عالی خواندید! میزان تطابق واژگان: ${pct}٪`
            : `خوب بود (${pct}٪ تطابق). یک بار دیگر تلفظ گوینده را بشنوید و آرام‌تر تکرار کنید.`
        );
      };
      rec.onerror = () => {
        setSpeechNotice('تشخیص صدا انجام نشد. لطفاً میکروفون را بررسی کنید یا همراه گوینده تکرار نمایید.');
        setListeningLineId(null);
      };
      rec.onend = () => {
        setListeningLineId(null);
      };
      rec.start();
    } catch {
      setSpeechNotice('تشخیص گفتار در دسترس نیست؛ همراه با پخش صوت جمله را تکرار کنید.');
    }
  };

  const completedList = progress.completedStages[String(lesson.id)] ?? [];
  const currentStageIndex = availableStages.findIndex((s) => s.id === stage);

  const goNextStage = () => {
    onCompleteStage(lesson.id, stage);
    if (currentStageIndex < availableStages.length - 1) {
      switchStage(availableStages[currentStageIndex + 1].id);
    }
  };

  // Helper for Vocab Quick Drill in Stage 2
  const currentVocabItem = lessonVocab[vocabQuizIdx % Math.max(1, lessonVocab.length)];
  const vocabOptions = React.useMemo(() => {
    if (!currentVocabItem) return [];
    const distractors = PROSPECT2_VOCAB.filter((v) => v.id !== currentVocabItem.id)
      .slice(0, 12)
      .sort((a, b) => a.en.localeCompare(b.en))
      .slice(0, 3);
    const combined = [currentVocabItem, ...distractors];
    // Deterministic rotate based on vocabQuizIdx
    const shift = vocabQuizIdx % combined.length;
    return [...combined.slice(shift), ...combined.slice(0, shift)];
  }, [currentVocabItem, vocabQuizIdx]);

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-6">
      {/* Lesson Header & Back Button */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-tv-focusable="true"
            onClick={onBackHome}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowRight className="h-4 w-4" />
            <span>بازگشت به فهرست</span>
          </button>

          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-en font-semibold text-teal-700 dark:text-teal-400">{lesson.code}</span>
              <span aria-hidden="true" className="mx-1.5">·</span>
              <span>{lesson.pages}</span>
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              {lesson.titleFa} — <span className="font-en font-bold text-slate-600 dark:text-slate-300">{lesson.titleEn}</span>
            </h1>
          </div>
        </div>

        <button
          type="button"
          data-tv-focusable="true"
          onClick={() => onAskTutor(`در ${lesson.titleFa} درباره "${lesson.functionFa}" سؤال دارم.`)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-100 cursor-pointer whitespace-nowrap shrink-0"
        >
          <HelpCircle className="h-4 w-4" />
          <span>سؤال از معلم هوشمند درباره این درس</span>
        </button>
      </div>

      {/* Stage Stepper Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-900 p-1.5 border border-slate-200 dark:border-slate-800">
        {availableStages.map((s) => {
          const isActive = stage === s.id;
          const isDone = completedList.includes(s.id);
          return (
            <button
              key={s.id}
              type="button"
              data-tv-focusable="true"
              onClick={() => switchStage(s.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= STAGE 1: CONVERSATION & SYNCED AUDIO ================= */}
      {stage === 'conversation' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {lesson.conversationTitleFa}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  روی هر خط کلیک کنید یا پخش کامل را بزنید تا کلمات همزمان با صدای گوینده روشن شوند.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={handlePlayAllConversation}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white cursor-pointer whitespace-nowrap shrink-0 ${
                    isPlayingAll ? 'bg-rose-600 hover:bg-rose-700' : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {isPlayingAll ? (
                    <>
                      <Square className="h-4 w-4 fill-current" />
                      <span>توقف پخش مکالمه</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" />
                      <span>پخش کامل با هایلایت همزمان</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => setShowPersian((v) => !v)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                >
                  {showPersian ? 'مخفی کردن ترجمه فارسی' : 'نمایش ترجمه فارسی'}
                </button>
              </div>
            </div>

            {speechNotice && (
              <div className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/40 px-4 py-3 text-sm text-teal-900 dark:text-teal-200">
                <p>{speechNotice}</p>
                {speechTranscript && (
                  <p className="mt-1 font-en text-xs text-teal-700 dark:text-teal-300">
                    متن شنیده‌شده: "{speechTranscript}"
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              {lesson.conversation.map((line) => {
                const isLineActive = activeLineId === line.id;
                const words = line.en.split(/\s+/);

                return (
                  <div
                    key={line.id}
                    className={`rounded-xl border p-4 transition-colors ${
                      isLineActive
                        ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-[260px]">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-bold text-teal-700 dark:text-teal-400">
                            {line.speakerFa}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-en">{line.speaker}</span>
                        </div>

                        {/* Synced Karaoke Word Display */}
                        <p className="font-en text-lg sm:text-xl font-semibold leading-relaxed text-slate-900 dark:text-white flex flex-wrap gap-x-1.5 gap-y-1">
                          {words.map((word, wIdx) => {
                            const highlighted = isLineActive && activeWordIdx === wIdx;
                            return (
                              <span
                                key={`${line.id}-w-${wIdx}`}
                                className={`rounded px-1 transition-colors ${
                                  highlighted
                                    ? 'bg-amber-300 text-slate-950 dark:bg-amber-400'
                                    : ''
                                }`}
                              >
                                {word}
                              </span>
                            );
                          })}
                        </p>

                        {showPersian && (
                          <p className="text-sm text-slate-600 dark:text-slate-300">{line.fa}</p>
                        )}

                        {line.highlightNote && (
                          <p className="text-xs text-amber-700 dark:text-amber-400 pt-1">
                            نکته آموزشی: {line.highlightNote}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={() => handlePlayLine(line.id, line.en)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-teal-500 cursor-pointer whitespace-nowrap"
                        >
                          <Volume2 className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                          <span>شنیدن</span>
                        </button>

                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={() => handlePracticeSpeech(line.id, line.en)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-semibold cursor-pointer whitespace-nowrap ${
                            listeningLineId === line.id
                              ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-amber-500'
                          }`}
                        >
                          {listeningLineId === line.id ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>تکرار و تمرین تلفظ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Practices 1-3 */}
          {lesson.practices.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {lesson.practices.map((practice) => (
                <div
                  key={practice.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
                >
                  <div>
                    <p className="font-en text-xs font-semibold text-teal-700 dark:text-teal-400">
                      {practice.title}
                    </p>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {practice.titleFa}
                    </h3>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {practice.pairs.map((pair, idx) => (
                      <div key={idx} className="py-3 flex items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-en text-sm font-semibold text-slate-900 dark:text-white">
                            {pair.question}
                          </p>
                          <p className="font-en text-sm text-teal-700 dark:text-teal-400">
                            → {pair.answer}
                          </p>
                          {showPersian && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">{pair.fa}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={() =>
                            speakEnglish({
                              text: `${pair.question} ${pair.answer}`,
                              rate: progress.speechRate,
                            })
                          }
                          aria-label={`پخش صوت ${pair.question}`}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 p-2.5 text-slate-600 dark:text-slate-300 hover:border-teal-500 cursor-pointer shrink-0"
                        >
                          <Volume2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= STAGE 2: VOCABULARY & QUICK TEST ================= */}
      {stage === 'vocabulary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {lessonVocab.map((v) => {
              const srs = progress.vocabSRS[v.id];
              return (
                <div
                  key={v.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{v.category} · {v.pageRef}</span>
                      <span className="tabular-nums">جعبه لایتنر {srs?.box ?? 1}/۵</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-en text-xl font-bold text-slate-900 dark:text-white">
                        {v.en}
                      </h3>
                      <button
                        type="button"
                        data-tv-focusable="true"
                        onClick={() => speakEnglish({ text: v.en, rate: progress.speechRate })}
                        className="rounded-lg bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 p-2.5 text-teal-700 dark:text-teal-300 cursor-pointer shrink-0"
                        aria-label={`تلفظ ${v.en}`}
                      >
                        <Volume2 className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="font-ipa text-xs text-slate-500 dark:text-slate-400">{v.ipa}</p>
                    <p className="text-base font-bold text-teal-700 dark:text-teal-400">{v.fa}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1">
                    <p className="font-en text-xs text-slate-700 dark:text-slate-300">{v.exampleEn}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{v.exampleFa}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {currentVocabItem && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    پرسش تعاملی لغات این درس (تثبیت در حافظه)
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    معنی فارسی عبارت انگلیسی زیر چیست؟
                  </p>
                </div>
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => speakEnglish({ text: currentVocabItem.en, rate: progress.speechRate })}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  <Volume2 className="h-4 w-4 text-teal-600" />
                  <span>شنیدن تلفظ</span>
                </button>
              </div>

              <p className="font-en text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentVocabItem.en}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vocabOptions.map((opt) => {
                  const isCorrect = opt.id === currentVocabItem.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-tv-focusable="true"
                      onClick={() => {
                        playFeedbackTone(isCorrect ? 'correct' : 'wrong', progress.soundEffects);
                        onRecordVocabAttempt(currentVocabItem.id, isCorrect);
                        setVocabQuizFeedback({
                          correct: isCorrect,
                          message: isCorrect
                            ? `آفرین! "${currentVocabItem.en}" یعنی «${currentVocabItem.fa}». این لغت به جعبه بالاتر منتقل شد.`
                            : `نادرست بود. معنی صحیح "${currentVocabItem.en}" می‌شود «${currentVocabItem.fa}». در مرور بعدی دوباره پرسیده می‌شود.`,
                        });
                      }}
                      className="text-right rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 hover:border-teal-500 px-4 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {opt.fa}
                    </button>
                  );
                })}
              </div>

              {vocabQuizFeedback && (
                <div
                  className={`flex flex-wrap items-center justify-between gap-4 rounded-xl p-4 text-sm ${
                    vocabQuizFeedback.correct
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                  }`}
                >
                  <span>{vocabQuizFeedback.message}</span>
                  <button
                    type="button"
                    data-tv-focusable="true"
                    onClick={() => {
                      setVocabQuizIdx((i) => i + 1);
                      setVocabQuizFeedback(null);
                    }}
                    className="rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 text-xs font-bold cursor-pointer"
                  >
                    لغت بعدی
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= STAGE 3: STEP-BY-STEP GRAMMAR ================= */}
      {stage === 'grammar' && (
        <div className="space-y-6">
          {lesson.grammar.map((g) => (
            <div
              key={g.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
            >
              <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <p className="font-en text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {g.titleEn}
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {g.titleFa}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {g.summaryFa}
                </p>
              </div>

              {/* Formula Box */}
              <div className="rounded-xl bg-slate-900 dark:bg-slate-950 text-amber-300 p-4 font-ipa text-sm sm:text-base text-center">
                {g.formula}
              </div>

              {/* Step-by-step explanations */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  آموزش گام‌به‌گام:
                </h3>
                <ol className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {g.stepsFa.map((step, idx) => (
                    <li
                      key={idx}
                      className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-4 py-2.5"
                    >
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Book Examples + Extra Out-of-Book Examples */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-teal-700 dark:text-teal-400">
                    مثال‌های کتاب درسی
                  </h4>
                  {g.bookExamples.map((ex, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
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
                        aria-label="پخش مثال"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    مثال‌های بیشتر (خارج از کتاب برای درک عمیق‌تر)
                  </h4>
                  {g.extraExamples.map((ex, i) => (
                    <div key={i} className="flex items-start justify-between gap-2">
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
                        aria-label="پخش مثال"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistake Alert */}
              <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 space-y-1.5">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-300">
                  هشدار اشتباه رایج دانش‌آموزان:
                </p>
                <p className="font-en text-sm text-rose-700 dark:text-rose-300">
                  ✗ {g.commonMistakeFa.wrong}
                </p>
                <p className="font-en text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  ✓ {g.commonMistakeFa.right}
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  {g.commonMistakeFa.reasonFa}
                </p>
              </div>

              {/* Interactive Grammar Check */}
              <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  تمرین درک گرامر (توضیح علت درست یا نادرست بودن پاسخ):
                </h4>
                {g.practiceQuestions.map((pq) => {
                  const chosen = grammarAnswers[pq.id];
                  const answered = chosen !== undefined;
                  const isCorrect = chosen === pq.correctIndex;
                  return (
                    <div
                      key={pq.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {pq.promptFa}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {pq.options.map((opt, oIdx) => {
                          let btnClass =
                            'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200';
                          if (answered && oIdx === pq.correctIndex) {
                            btnClass =
                              'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                          } else if (answered && oIdx === chosen && !isCorrect) {
                            btnClass =
                              'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                          }
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              data-tv-focusable="true"
                              onClick={() => {
                                const right = oIdx === pq.correctIndex;
                                playFeedbackTone(right ? 'correct' : 'wrong', progress.soundEffects);
                                setGrammarAnswers((prev) => ({ ...prev, [pq.id]: oIdx }));
                                onRecordQuizAnswer(pq, right);
                              }}
                              className={`font-en text-left rounded-xl border px-4 py-3 text-sm font-semibold cursor-pointer transition-colors ${btnClass}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {answered && (
                        <p
                          className={`text-xs leading-relaxed ${
                            isCorrect
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {isCorrect ? pq.explanationRightFa : pq.explanationWrongFa}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= STAGE 4: PHONICS & SPELLING ================= */}
      {stage === 'phonics' && (
        <div className="space-y-6">
          {lesson.phonics.map((ph) => (
            <div
              key={ph.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5"
            >
              <div className="space-y-2">
                <p className="font-en text-sm font-bold text-teal-700 dark:text-teal-400">
                  {ph.pattern}
                </p>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  {ph.titleFa}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {ph.explanationFa}
                </p>
              </div>

              {ph.wrongWarning && (
                <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200">
                  نکته تلفظی مهم کتاب (*): {ph.wrongWarning}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ph.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <p className="font-en text-base font-bold text-slate-900 dark:text-white">
                        {ex.word}
                      </p>
                      <p className="font-ipa text-xs text-slate-500 dark:text-slate-400">
                        {ex.ipa}
                      </p>
                      <p className="text-xs text-teal-700 dark:text-teal-400">{ex.fa}</p>
                    </div>
                    <button
                      type="button"
                      data-tv-focusable="true"
                      onClick={() =>
                        speakEnglish({
                          text: ex.word.replace(/\//g, ', '),
                          rate: progress.speechRate,
                        })
                      }
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 cursor-pointer shrink-0"
                      aria-label={`پخش تلفظ ${ex.word}`}
                    >
                      <Volume2 className="h-4 w-4 text-teal-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= STAGE 5: GUIDED TEXTBOOK EXERCISES ================= */}
      {stage === 'exercises' && (
        <div className="space-y-6">
          {lesson.exercises.map((ex) => (
            <div
              key={ex.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6"
            >
              <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <p className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                  {ex.pageRef}
                </p>
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  {ex.titleFa}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">{ex.instructionFa}</p>
              </div>

              {/* Optional Playable Listening Script */}
              {ex.audioScript && ex.audioScript.length > 0 && (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 space-y-3">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    پخش فایل صوتی تمرین کتاب (Listening):
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ex.audioScript.map((scr) => (
                      <div
                        key={scr.id}
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-teal-700 dark:text-teal-400">
                            {scr.speakerFa}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{scr.fa}</p>
                        </div>
                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={() => speakEnglish({ text: scr.en, rate: progress.speechRate })}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white cursor-pointer shrink-0"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          <span>پخش صوت</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step-by-step Question Items */}
              <div className="space-y-4">
                {ex.items.map((item) => {
                  const val = exerciseInputs[item.id] ?? '';
                  const hintsCount = exerciseHintsUsed[item.id] ?? 0;
                  const status = exerciseStatus[item.id] ?? 'idle';
                  const isSolved =
                    status === 'correct' || progress.solvedExerciseIds.includes(item.id);

                  const checkAnswer = () => {
                    const normalized = val.trim().toLowerCase();
                    const accepted = [
                      item.answer.toLowerCase(),
                      ...(item.acceptableAnswers?.map((a) => a.toLowerCase()) ?? []),
                    ];
                    if (accepted.includes(normalized)) {
                      playFeedbackTone('correct', progress.soundEffects);
                      setExerciseStatus((prev) => ({ ...prev, [item.id]: 'correct' }));
                      onMarkExerciseSolved(item.id);
                    } else {
                      playFeedbackTone('wrong', progress.soundEffects);
                      setExerciseStatus((prev) => ({ ...prev, [item.id]: 'wrong' }));
                    }
                  };

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-en text-sm font-bold text-teal-700 dark:text-teal-400">
                            {item.promptEn}
                          </p>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">
                            {item.promptFa}
                          </p>
                        </div>
                        {isSolved && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>حل شده</span>
                          </span>
                        )}
                      </div>

                      {/* TV-friendly Letter Picker if available */}
                      {item.letterOptions && (
                        <div className="flex flex-wrap items-center gap-2" dir="ltr">
                          {item.letterOptions.map((ch, idx) => (
                            <button
                              key={`${item.id}-l-${idx}`}
                              type="button"
                              data-tv-focusable="true"
                              onClick={() =>
                                setExerciseInputs((prev) => ({
                                  ...prev,
                                  [item.id]: (prev[item.id] ?? '') + ch,
                                }))
                              }
                              className="h-10 min-w-[40px] px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-en font-bold text-slate-900 dark:text-white hover:border-teal-500 cursor-pointer"
                            >
                              {ch === ' ' ? 'Space' : ch}
                            </button>
                          ))}
                          <button
                            type="button"
                            data-tv-focusable="true"
                            onClick={() =>
                              setExerciseInputs((prev) => ({
                                ...prev,
                                [item.id]: (prev[item.id] ?? '').slice(0, -1),
                              }))
                            }
                            className="h-10 px-3 rounded-lg border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-700 dark:text-rose-300 cursor-pointer"
                          >
                            پاک کردن حرف
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          dir="ltr"
                          value={val}
                          onChange={(e) =>
                            setExerciseInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                          }
                          placeholder="پاسخ انگلیسی را بنویسید..."
                          className="flex-1 min-w-[220px] rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 font-en text-base font-semibold text-slate-900 dark:text-white"
                        />

                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={checkAnswer}
                          className="rounded-xl bg-teal-700 hover:bg-teal-800 px-5 py-2.5 text-sm font-bold text-white cursor-pointer whitespace-nowrap"
                        >
                          بررسی پاسخ
                        </button>

                        <button
                          type="button"
                          data-tv-focusable="true"
                          onClick={() =>
                            setExerciseHintsUsed((prev) => ({
                              ...prev,
                              [item.id]: Math.min(3, (prev[item.id] ?? 0) + 1),
                            }))
                          }
                          className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-2.5 text-xs font-bold text-amber-800 dark:text-amber-300 cursor-pointer whitespace-nowrap"
                        >
                          <Lightbulb className="h-4 w-4" />
                          <span>راهنمای گام‌به‌گام ({hintsCount}/۳)</span>
                        </button>

                        {status === 'wrong' && (
                          <button
                            type="button"
                            data-tv-focusable="true"
                            onClick={() => {
                              setExerciseInputs((prev) => ({ ...prev, [item.id]: item.answer }));
                              setExerciseStatus((prev) => ({ ...prev, [item.id]: 'revealed' }));
                            }}
                            className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer whitespace-nowrap"
                          >
                            مشاهده پاسخ و روش حل
                          </button>
                        )}
                      </div>

                      {/* Progressive Hints (Never dumps answer upfront) */}
                      {hintsCount > 0 && (
                        <div className="space-y-1.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3 text-xs text-amber-900 dark:text-amber-200">
                          {item.hints.slice(0, hintsCount).map((h, i) => (
                            <p key={i}>
                              گام {i + 1}: {h}
                            </p>
                          ))}
                        </div>
                      )}

                      {status === 'wrong' && (
                        <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                          پاسخ شما دقیق نبود. از راهنمای گام‌به‌گام استفاده کنید و دوباره تلاش کنید!
                        </p>
                      )}

                      {(status === 'correct' || status === 'revealed') && (
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3.5 space-y-1 text-xs text-emerald-900 dark:text-emerald-200">
                          <p className="font-bold">
                            پاسخ صحیح: <span className="font-en text-sm">{item.answer}</span>
                          </p>
                          <p>{item.explanationFa}</p>
                          <p className="text-teal-800 dark:text-teal-300 font-semibold">
                            ترفند حل سوالات مشابه: {item.trickFa}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= STAGE 6: END-OF-LESSON QUIZ ================= */}
      {stage === 'quiz' && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
          {!examFinished && lesson.quiz[examIdx] ? (
            <>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                    آزمون جامع {lesson.titleFa}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                    پرسش {examIdx + 1} از {lesson.quiz.length} · مهارت: {lesson.quiz[examIdx].skill}
                  </p>
                </div>
                <span className="text-sm font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                  امتیاز فعلی: {examScore}
                </span>
              </div>

              <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {lesson.quiz[examIdx].promptFa}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {lesson.quiz[examIdx].options.map((opt, oIdx) => {
                  const q = lesson.quiz[examIdx];
                  const answered = examSelected !== null;
                  const isCorrectOpt = oIdx === q.correctIndex;
                  const isChosen = examSelected === oIdx;

                  let cls =
                    'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 hover:border-teal-500 text-slate-900 dark:text-white';
                  if (answered && isCorrectOpt) {
                    cls =
                      'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200';
                  } else if (answered && isChosen && !isCorrectOpt) {
                    cls =
                      'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200';
                  }

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      disabled={answered}
                      data-tv-focusable="true"
                      onClick={() => {
                        setExamSelected(oIdx);
                        const ok = oIdx === q.correctIndex;
                        playFeedbackTone(ok ? 'correct' : 'wrong', progress.soundEffects);
                        if (ok) setExamScore((s) => s + 1);
                        onRecordQuizAnswer(q, ok);
                      }}
                      className={`text-right rounded-xl border p-4 text-sm font-semibold cursor-pointer transition-colors ${cls}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {examSelected !== null && (
                <div className="space-y-4">
                  <div
                    className={`rounded-xl border p-4 text-sm space-y-2 ${
                      examSelected === lesson.quiz[examIdx].correctIndex
                        ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {examSelected === lesson.quiz[examIdx].correctIndex ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <XCircle className="h-5 w-5" />
                      )}
                      <span>
                        {examSelected === lesson.quiz[examIdx].correctIndex
                          ? 'پاسخ صحیح!'
                          : 'نیاز به دقت بیشتر'}
                      </span>
                    </div>
                    <p>
                      {examSelected === lesson.quiz[examIdx].correctIndex
                        ? lesson.quiz[examIdx].explanationRightFa
                        : lesson.quiz[examIdx].explanationWrongFa}
                    </p>
                    {examSelected !== lesson.quiz[examIdx].correctIndex && (
                      <button
                        type="button"
                        data-tv-focusable="true"
                        onClick={() =>
                          onAskTutor(
                            `در سؤال "${lesson.quiz[examIdx].promptFa}" اشتباه کردم. لطفاً مبحث "${lesson.quiz[examIdx].reTeachTopicFa}" را دوباره و ساده توضیح بده.`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 text-white px-3.5 py-2 text-xs font-bold cursor-pointer mt-1"
                      >
                        <span>آموزش مجدد این مبحث با معلم هوشمند</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    data-tv-focusable="true"
                    onClick={() => {
                      if (examIdx + 1 < lesson.quiz.length) {
                        setExamIdx((i) => i + 1);
                        setExamSelected(null);
                      } else {
                        setExamFinished(true);
                        onSaveLessonExam(lesson.id, examScore, lesson.quiz.length);
                        onCompleteStage(lesson.id, 'quiz');
                      }
                    }}
                    className="rounded-xl bg-teal-700 hover:bg-teal-800 px-6 py-3 text-sm font-bold text-white cursor-pointer"
                  >
                    {examIdx + 1 < lesson.quiz.length ? 'سؤال بعدی' : 'مشاهده کارنامه پایان درس'}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6 space-y-4">
              <Award className="h-14 w-14 mx-auto text-amber-500" />
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                کارنامه {lesson.titleFa}
              </h2>
              <p className="text-lg font-bold text-teal-700 dark:text-teal-400 tabular-nums">
                نمره شما: {examScore} از {lesson.quiz.length}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                {examScore === lesson.quiz.length
                  ? 'فوق‌العاده! تمام مفاهیم این درس را با موفقیت کامل یاد گرفتید.'
                  : 'عملکرد خوبی داشتید! مباحثی که اشتباه شدند به فهرست مرور هوشمند اضافه شدند.'}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => {
                    setExamIdx(0);
                    setExamSelected(null);
                    setExamScore(0);
                    setExamFinished(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-5 py-2.5 text-sm font-semibold cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>تکرار آزمون</span>
                </button>
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={onBackHome}
                  className="rounded-xl bg-teal-700 px-6 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  بازگشت به نقشه درس‌ها
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Stage Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
        <button
          type="button"
          data-tv-focusable="true"
          disabled={currentStageIndex <= 0}
          onClick={() => switchStage(availableStages[currentStageIndex - 1].id)}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40 cursor-pointer"
        >
          مرحله قبل
        </button>

        {currentStageIndex < availableStages.length - 1 ? (
          <button
            type="button"
            data-tv-focusable="true"
            onClick={goNextStage}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 hover:bg-teal-800 px-6 py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            <span>تکمیل و ادامه به مرحله بعد</span>
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            data-tv-focusable="true"
            onClick={() => {
              onCompleteStage(lesson.id, stage);
              onBackHome();
            }}
            className="rounded-xl bg-emerald-700 hover:bg-emerald-800 px-6 py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            ثبت پایان درس و بازگشت
          </button>
        )}
      </div>
    </div>
  );
};
