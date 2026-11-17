import React, { useEffect, useState } from 'react';
import { Send, X } from 'lucide-react';
import { getLessonById, getOfflineTutorReply } from '../data/prospect2';

interface ChatMessage {
  role: 'tutor' | 'student';
  text: string;
}

interface SmartTutorDrawerProps {
  isOpen: boolean;
  lessonId: number;
  prefillPrompt?: string;
  onClose: () => void;
}

export const SmartTutorDrawer: React.FC<SmartTutorDrawerProps> = ({
  isOpen,
  lessonId,
  prefillPrompt,
  onClose,
}) => {
  const lesson = getLessonById(lessonId);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'tutor',
      text: `سلام دانش‌آموز عزیز! من معلم هوشمند کتاب پراسپکت ۲ هستم. هر سؤالی درباره «${lesson.titleFa}»، گرامر، تلفظ، معنی لغات یا حل تمرین‌های کتاب داری بپرس تا گام‌به‌گام توضیح دهم.`,
    },
  ]);

  useEffect(() => {
    if (prefillPrompt && isOpen) {
      setInput(prefillPrompt);
    }
  }, [prefillPrompt, isOpen]);

  if (!isOpen) return null;

  const sendQuestion = async (questionText?: string) => {
    const q = (questionText ?? input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'student', text: q }]);
    setLoading(true);

    try {
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        const res = await fetch('/api/tutor/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: q,
            lessonId,
            lessonTitle: `${lesson.titleFa} (${lesson.titleEn})`,
            contextSummary: `${lesson.functionFa}. Key expressions: ${lesson.keyExpressions.join(', ')}`,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            setMessages((prev) => [...prev, { role: 'tutor', text: data.answer }]);
            setLoading(false);
            return;
          }
        }
      }
    } catch {
      // Fall back cleanly to offline diagnostic knowledge base
    }

    const offlineAnswer = getOfflineTutorReply(q, lessonId);
    setMessages((prev) => [...prev, { role: 'tutor', text: offlineAnswer }]);
    setLoading(false);
  };

  const quickChips = [
    'تفاوت from Iran و Iranian چیه؟',
    'تلفظ oo در football و afternoon چه فرقی دارد؟',
    'چه زمانی از good at و چه زمانی از can استفاده کنیم؟',
    'توصیه پزشکی با should و Why don’t you چطور است؟',
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full flex flex-col border-r border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
          <div className="flex items-center gap-3">
            <img
              src="/src/assets/images/tutor_smart_avatar_1794855365158.jpg"
              alt="آواتار معلم هوشمند"
              referrerPolicy="no-referrer"
              className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
            />
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                معلم هوشمند پراسپکت ۲
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                زمینه فعلی: {lesson.titleFa}
              </p>
            </div>
          </div>

          <button
            type="button"
            data-tv-focusable="true"
            onClick={onClose}
            aria-label="بستن پنجره معلم هوشمند"
            className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'student'
                  ? 'bg-teal-700 text-white mr-8'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 ml-6'
              }`}
            >
              {m.text}
            </div>
          ))}

          {loading && (
            <div className="rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-xs text-slate-500 ml-6">
              معلم هوشمند در حال بررسی سؤال شما است...
            </div>
          )}
        </div>

        {/* Quick Question Chips for TV Remote Users */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            پرسش‌های سریع (مناسب کنترل تلویزیون):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {quickChips.map((chip) => (
              <button
                key={chip}
                type="button"
                data-tv-focusable="true"
                onClick={() => sendQuestion(chip)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:border-teal-500 cursor-pointer"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendQuestion();
          }}
          className="border-t border-slate-200 dark:border-slate-800 p-4 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="سؤال خود را به فارسی یا انگلیسی بنویسید..."
            className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            data-tv-focusable="true"
            className="rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 p-3 text-white cursor-pointer"
            aria-label="ارسال سؤال"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
