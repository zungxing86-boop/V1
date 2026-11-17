/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AppView, LessonStage, QuizQuestion, StudentProgress } from './types/curriculum';
import { getLessonById } from './data/prospect2';
import {
  getDefaultProgress,
  loadProgress,
  markStageCompleted,
  saveProgress,
  updateVocabSRS,
} from './utils/storage';
import { useTVNavigation } from './hooks/useTVNavigation';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { LessonSidebar } from './components/LessonSidebar';
import { TopBar } from './components/TopBar';
import { HomeHub } from './components/HomeHub';
import { LessonWorkspace } from './components/LessonWorkspace';
import { VocabularyLab } from './components/VocabularyLab';
import { GrammarAcademy } from './components/GrammarAcademy';
import { SmartReviewAnalytics } from './components/SmartReviewAnalytics';
import { TechnicalBlueprintView } from './components/TechnicalBlueprintView';
import { SmartTutorDrawer } from './components/SmartTutorDrawer';

export default function App() {
  const [progress, setProgress] = useState<StudentProgress>(() => loadProgress());
  const [view, setView] = useState<AppView>('home');
  const [activeLessonId, setActiveLessonId] = useState<number>(() => progress.lastLessonId || 1);
  const [activeStage, setActiveStage] = useState<LessonStage>(() => progress.lastStage || 'conversation');
  const [speechError, setSpeechError] = useState(false);
  useEffect(() => {
    const handler = () => setSpeechError(true);
    window.addEventListener('speech-error', handler);
    return () => window.removeEventListener('speech-error', handler);
  }, []);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorPrefill, setTutorPrefill] = useState<string | undefined>(undefined);
  const isOnline = useOnlineStatus();

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (progress.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [progress.darkMode]);

  // Persist progress offline on every update
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Android TV Remote D-Pad & Back button handler
  useTVNavigation(() => {
    if (tutorOpen) {
      setTutorOpen(false);
    } else if (view !== 'home') {
      setView('home');
    }
  });

  const handleOpenLesson = (lessonId: number, stage: LessonStage = 'conversation') => {
    setActiveLessonId(lessonId);
    setActiveStage(stage);
    setView('lesson');
    setProgress((prev) => ({
      ...prev,
      lastLessonId: lessonId,
      lastStage: stage,
    }));
  };

  const handleCompleteStage = (lessonId: number, stage: LessonStage) => {
    setProgress((prev) => markStageCompleted(prev, lessonId, stage));
  };

  const handleRecordVocabAttempt = (vocabId: string, isCorrect: boolean) => {
    setProgress((prev) => ({
      ...prev,
      xp: prev.xp + (isCorrect ? 10 : 2),
      totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
      totalWrong: prev.totalWrong + (isCorrect ? 0 : 1),
      vocabSRS: updateVocabSRS(prev.vocabSRS, vocabId, isCorrect),
    }));
  };

  const handleRecordQuizAnswer = (question: QuizQuestion, isCorrect: boolean) => {
    setProgress((prev) => {
      const nextWeak = { ...prev.weakGrammarIds };
      if (isCorrect) {
        if (nextWeak[question.id] && nextWeak[question.id] > 0) {
          nextWeak[question.id] = nextWeak[question.id] - 1;
        }
      } else {
        nextWeak[question.id] = (nextWeak[question.id] ?? 0) + 1;
      }

      return {
        ...prev,
        xp: prev.xp + (isCorrect ? 15 : 2),
        totalCorrect: prev.totalCorrect + (isCorrect ? 1 : 0),
        totalWrong: prev.totalWrong + (isCorrect ? 0 : 1),
        weakGrammarIds: nextWeak,
      };
    });
  };

  const handleSaveLessonExam = (lessonId: number, score: number, total: number) => {
    setProgress((prev) => {
      const existing = prev.lessonQuizScores[lessonId];
      return {
        ...prev,
        xp: prev.xp + score * 20,
        lessonQuizScores: {
          ...prev.lessonQuizScores,
          [lessonId]: {
            bestScore: Math.max(existing?.bestScore ?? 0, score),
            total,
            attempts: (existing?.attempts ?? 0) + 1,
          },
        },
      };
    });
  };

  const handleMarkExerciseSolved = (exerciseId: string) => {
    setProgress((prev) => {
      if (prev.solvedExerciseIds.includes(exerciseId)) return prev;
      return {
        ...prev,
        xp: prev.xp + 15,
        solvedExerciseIds: [...prev.solvedExerciseIds, exerciseId],
      };
    });
  };

  const activeLesson = getLessonById(activeLessonId);

  return (
    <div className="tv-frame bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="tv-scroll">
      {speechError && (
        <div role="alert" className="p-4 bg-amber-100 text-slate-900">
          پخش صدا ممکن نشد. صدای تلویزیون را بررسی کنید و دوباره تلاش کنید.
          <button data-tv-focusable="true" onClick={() => setSpeechError(false)}>بستن</button>
        </div>
      )}
      <TopBar
        currentView={view}
        onNavigate={(v) => setView(v)}
        onOpenTutor={() => {
          setTutorPrefill(undefined);
          setTutorOpen(true);
        }}
      />

      <div className={(view === 'home' || view === 'lesson') ? 'learning-layout' : ''}>
        {(view === 'home' || view === 'lesson') && (
          <LessonSidebar progress={progress} activeId={view === 'lesson' ? activeLessonId : undefined}
            onOpen={id => handleOpenLesson(id)} />
        )}
      <main className="pb-12 learning-main">
        {view === 'home' && (
          <HomeHub
            progress={progress}
            onOpenLesson={handleOpenLesson}
            onNavigate={(v) => setView(v)}
            onToggleDark={() =>
              setProgress((prev) => ({ ...prev, darkMode: !prev.darkMode }))
            }
            onToggleSpeechRate={() =>
              setProgress((prev) => ({
                ...prev,
                speechRate: prev.speechRate < 0.85 ? 0.95 : 0.75,
              }))
            }
          />
        )}

        {view === 'lesson' && (
          <LessonWorkspace
            lesson={activeLesson}
            initialStage={activeStage}
            progress={progress}
            onStageChange={(s) => {
              setActiveStage(s);
              setProgress((prev) => ({ ...prev, lastStage: s }));
            }}
            onCompleteStage={handleCompleteStage}
            onRecordVocabAttempt={handleRecordVocabAttempt}
            onRecordQuizAnswer={handleRecordQuizAnswer}
            onSaveLessonExam={handleSaveLessonExam}
            onMarkExerciseSolved={handleMarkExerciseSolved}
            onBackHome={() => setView('home')}
            onAskTutor={(prompt) => {
              setTutorPrefill(prompt);
              setTutorOpen(true);
            }}
          />
        )}

        {view === 'vocabulary' && (
          <VocabularyLab
            progress={progress}
            onRecordAttempt={handleRecordVocabAttempt}
          />
        )}

        {view === 'grammar' && (
          <GrammarAcademy
            progress={progress}
            onRecordQuizAnswer={handleRecordQuizAnswer}
          />
        )}

        {view === 'review' && (
          <SmartReviewAnalytics
            progress={progress}
            onOpenLesson={handleOpenLesson}
            onGoToVocabReview={() => setView('vocabulary')}
            onResetProgress={() => setProgress(getDefaultProgress())}
          />
        )}

        {view === 'blueprint' && <TechnicalBlueprintView />}
      </main>
      </div>

      <SmartTutorDrawer
        isOpen={tutorOpen}
        lessonId={activeLessonId}
        prefillPrompt={tutorPrefill}
        onClose={() => setTutorOpen(false)}
      />

      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-40 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-lg">
          حالت آفلاین فعال است — تمام درس‌ها و پیشرفت شما روی دستگاه ذخیره می‌شود
        </div>
      )}
      </div>
    </div>
  );
}
