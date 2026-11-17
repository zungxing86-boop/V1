import { LessonStage, StudentProgress, VocabSRSState } from '../types/curriculum';
import { PROSPECT2_VOCAB } from '../data/vocabData';

const STORAGE_KEY = 'prospect2_android_tv_progress_v1';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDefaultProgress(): StudentProgress {
  return {
    xp: 0,
    streakDays: 1,
    lastStudyDate: todayKey(),
    lastLessonId: 1,
    lastStage: 'conversation',
    completedStages: {},
    lessonQuizScores: {},
    solvedExerciseIds: [],
    vocabSRS: {},
    weakGrammarIds: {},
    totalCorrect: 0,
    totalWrong: 0,
    darkMode: false,
    speechRate: 0.9,
    soundEffects: true,
  };
}

export function loadProgress(): StudentProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<StudentProgress>;
    const defaults = getDefaultProgress();
    const merged: StudentProgress = { ...defaults, ...parsed };

    // Update daily streak safely
    const today = todayKey();
    if (merged.lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      merged.streakDays = merged.lastStudyDate === yesterday ? (merged.streakDays || 1) + 1 : 1;
      merged.lastStudyDate = today;
    }
    return merged;
  } catch {
    return getDefaultProgress();
  }
}

export function saveProgress(progress: StudentProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Ignore quota errors cleanly
  }
}

const LEITNER_INTERVAL_HOURS: Record<number, number> = {
  1: 0, // immediate / same session
  2: 12,
  3: 48,
  4: 120,
  5: 336, // 14 days mastered
};

export function updateVocabSRS(
  currentMap: Record<string, VocabSRSState>,
  vocabId: string,
  isCorrect: boolean
): Record<string, VocabSRSState> {
  const now = Date.now();
  const prev = currentMap[vocabId] ?? {
    box: 1,
    correctCount: 0,
    wrongCount: 0,
    lastReviewedAt: 0,
    nextReviewAt: 0,
  };

  const nextBox = isCorrect ? Math.min(5, prev.box + 1) : 1;
  const hours = LEITNER_INTERVAL_HOURS[nextBox] ?? 0;

  return {
    ...currentMap,
    [vocabId]: {
      box: nextBox,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
      lastReviewedAt: now,
      nextReviewAt: now + hours * 3600 * 1000,
    },
  };
}

export function getDueVocabIds(vocabSRS: Record<string, VocabSRSState>): string[] {
  const now = Date.now();
  return PROSPECT2_VOCAB.filter((item) => {
    const state = vocabSRS[item.id];
    if (!state) return true;
    return state.box < 5 && state.nextReviewAt <= now;
  }).map((i) => i.id);
}

export function getWeakVocabIds(vocabSRS: Record<string, VocabSRSState>): string[] {
  return PROSPECT2_VOCAB.filter((item) => {
    const state = vocabSRS[item.id];
    if (!state) return false;
    return state.wrongCount > 0 && state.box <= 2;
  })
    .sort((a, b) => (vocabSRS[b.id]?.wrongCount ?? 0) - (vocabSRS[a.id]?.wrongCount ?? 0))
    .map((i) => i.id);
}

export function markStageCompleted(
  progress: StudentProgress,
  lessonId: number,
  stage: LessonStage
): StudentProgress {
  const key = String(lessonId);
  const existing = progress.completedStages[key] ?? [];
  if (existing.includes(stage)) {
    return { ...progress, lastLessonId: lessonId, lastStage: stage };
  }
  return {
    ...progress,
    xp: progress.xp + 25,
    lastLessonId: lessonId,
    lastStage: stage,
    completedStages: {
      ...progress.completedStages,
      [key]: [...existing, stage],
    },
  };
}
