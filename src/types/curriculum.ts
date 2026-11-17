export type AppView = 'home' | 'lesson' | 'vocabulary' | 'grammar' | 'review' | 'blueprint';

export type LessonStage =
  | 'conversation'
  | 'vocabulary'
  | 'grammar'
  | 'phonics'
  | 'exercises'
  | 'quiz';

export interface DialogueLine {
  id: string;
  speaker: string;
  speakerFa: string;
  en: string;
  fa: string;
  highlightNote?: string;
}

export interface PracticePattern {
  title: string;
  titleFa: string;
  pairs: { question: string; answer: string; fa: string }[];
}

export interface VocabItem {
  id: string;
  lessonId: number;
  en: string;
  fa: string;
  ipa: string;
  category: string;
  pageRef: string;
  exampleEn: string;
  exampleFa: string;
  inPhotoDictionary?: boolean;
}

export interface GrammarPoint {
  id: string;
  lessonId: number;
  titleFa: string;
  titleEn: string;
  summaryFa: string;
  formula: string;
  stepsFa: string[];
  bookExamples: { en: string; fa: string }[];
  extraExamples: { en: string; fa: string }[];
  commonMistakeFa: { wrong: string; right: string; reasonFa: string };
  practiceQuestions: QuizQuestion[];
}

export interface PhonicsRule {
  id: string;
  lessonId: number;
  pattern: string;
  titleFa: string;
  explanationFa: string;
  wrongWarning?: string;
  examples: { word: string; ipa: string; fa: string }[];
}

export interface GuidedExercise {
  id: string;
  lessonId: number;
  type: 'crossword' | 'listening-table' | 'pair-card' | 'fill-blank' | 'check-if';
  titleFa: string;
  pageRef: string;
  instructionFa: string;
  audioScript?: DialogueLine[];
  items: GuidedExerciseItem[];
}

export interface GuidedExerciseItem {
  id: string;
  promptEn: string;
  promptFa: string;
  answer: string;
  acceptableAnswers?: string[];
  hints: [string, string, string]; // 3 progressive hints
  explanationFa: string;
  trickFa: string;
  letterOptions?: string[];
  rowMeta?: { label: string; col1Label?: string; col2Label?: string };
}

export interface QuizQuestion {
  id: string;
  lessonId: number;
  skill: 'vocabulary' | 'grammar' | 'phonics' | 'reading' | 'listening';
  promptFa: string;
  promptEn?: string;
  audioText?: string;
  options: string[];
  correctIndex: number;
  explanationRightFa: string;
  explanationWrongFa: string;
  reTeachTopicFa: string;
}

export interface LessonData {
  id: number;
  code: string; // e.g., "Lesson 1" or "Review 1"
  isReview?: boolean;
  titleEn: string;
  titleFa: string;
  pages: string;
  themeColor: string;
  imageUrl?: string;
  functionFa: string;
  keyExpressions: string[];
  conversationTitleFa: string;
  conversation: DialogueLine[];
  practices: PracticePattern[];
  grammar: GrammarPoint[];
  phonics: PhonicsRule[];
  exercises: GuidedExercise[];
  quiz: QuizQuestion[];
}

export interface VocabSRSState {
  box: number; // 1 to 5 (Leitner)
  correctCount: number;
  wrongCount: number;
  lastReviewedAt: number;
  nextReviewAt: number;
}

export interface StudentProgress {
  xp: number;
  streakDays: number;
  lastStudyDate: string;
  lastLessonId: number;
  lastStage: LessonStage;
  completedStages: Record<string, LessonStage[]>; // lessonId -> completed stages
  lessonQuizScores: Record<number, { bestScore: number; total: number; attempts: number }>;
  solvedExerciseIds: string[];
  vocabSRS: Record<string, VocabSRSState>;
  weakGrammarIds: Record<string, number>; // grammar/question id -> miss count
  totalCorrect: number;
  totalWrong: number;
  darkMode: boolean;
  speechRate: number; // 0.75 or 1.0
  soundEffects: boolean;
}
