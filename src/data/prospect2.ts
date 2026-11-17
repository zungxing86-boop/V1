import { LESSONS_1_TO_4 } from './lessons1to4';
import { LESSONS_5_TO_7 } from './lessons5to7';
import { PROSPECT2_VOCAB } from './vocabData';
import { LessonData } from '../types/curriculum';

export const TEXTBOOK_META = {
  titleFa: 'انگلیسی ۲ (پراسپکت ۲)',
  titleEn: 'Prospect 2 · English for Schools (Student Book)',
  gradeFa: 'پایه هشتم — دوره اول متوسطه',
  ageRangeFa: 'مخاطب: دانش‌آموزان ۱۳ تا ۱۴ ساله و معلمان زبان انگلیسی',
  bookCode: 'کد کتاب درسی: ۸۱۰ (سازمان پژوهش و برنامه ریزی آموزشی)',
  isbn: '978-964-05-2337-7',
  edition: 'چاپ سیزدهم ۱۴۰۵ / ۲۰۲۶',
  totalLessons: 7,
  totalReviews: 3,
};

export const ALL_LESSONS: LessonData[] = [...LESSONS_1_TO_4, ...LESSONS_5_TO_7];
export { PROSPECT2_VOCAB };

export function getLessonById(id: number): LessonData {
  return ALL_LESSONS.find((l) => l.id === id) ?? ALL_LESSONS[0];
}

export function getOfflineTutorReply(question: string, lessonId: number): string {
  const q = question.toLowerCase();
  const lesson = getLessonById(lessonId);

  if (q.includes('from') || q.includes('ملیت') || q.includes('کشور') || q.includes('iranian')) {
    return [
      'قانون طلایی درس ۱ (ملیت و کشور):',
      '• اگر اسم «کشور» را می‌گویید، حتماً قبلش from بگذارید: I am from Iran. / Is he from Spain?',
      '• اگر «ملیت» را می‌گویید، اصلاً from نیاورید: I am Iranian. / He is Spanish.',
      '• برای پرسیدن زادگاه از Where + am/is/are + فاعل + from? استفاده کنید.',
    ].join('\n');
  }

  if (q.includes('in ') || q.includes('on ') || q.includes('زمان') || q.includes('هفته') || q.includes('st')) {
    return [
      'راهنمای درس ۲ (روزهای هفته و زمان):',
      '• برای صبح، بعدازظهر و عصر به تنهایی از in the استفاده کنید: in the morning / afternoon / evening.',
      '• به محض آمدن نام روز هفته، حرف اضافه حتماً on می‌شود (حتی کنار morning): on Monday mornings / on Fridays.',
      '• قبل از every (مثل Every weekday) حرف اضافه نیاورید.',
      '• نکته تلفظ: اول کلمه study صدای /e/ اضافه تلفظ نکنید!',
    ].join('\n');
  }

  if (q.includes('can') || q.includes('good at') || q.includes('oo') || q.includes('توانایی')) {
    return [
      'راهنمای درس ۳ (توانایی‌ها):',
      '• بعد از can و can’t همیشه فعل ساده بدون s و بدون ing می‌آید: She can draw.',
      '• بعد از good at همیشه فعل + ing می‌آید: Are you good at drawing? Yes, I am.',
      '• تفاوت oo: در football و cook کوتاه (/ʊ/) است؛ در afternoon و too کشیده (/uː/) است.',
    ].join('\n');
  }

  if (q.includes('ache') || q.includes('should') || q.includes('health') || q.includes('درد') || q.includes('بیمار')) {
    return [
      'راهنمای درس ۴ (سلامتی و توصیه):',
      '• برای گفتن بیماری: I have a headache / He has a sore throat (سوم شخص مفرد has می‌گیرد).',
      '• پسوند ache به معنی درد است و همیشه «اِیک» (/eɪk/) تلفظ می‌شود، نه «چ»!',
      '• برای توصیه کردن دو ساختار عالی داریم: You should rest. یا Why don’t you see a doctor?',
    ].join('\n');
  }

  if (q.includes('there') || q.includes('city') || q.includes('like') || q.includes('شهر') || q.includes('جهت')) {
    return [
      'راهنمای درس ۵ (معرفی شهر):',
      '• سؤال "What’s Isfahan like?" یعنی «اصفهان چطور شهری است؟» (نه دوست داشتن).',
      '• برای مفرد: Is there a metro? → Yes, there is. | برای جمع: Are there any museums? → Yes, there are.',
      '• جهت‌ها: north (شمال)، south (جنوب)، east (شرق)، west (غرب)، center (مرکز).',
    ].join('\n');
  }

  if (q.includes('weather') || q.includes('th') || q.includes('village') || q.includes('هوا') || q.includes('فصل')) {
    return [
      'راهنمای درس ۶ (روستا و آب‌وهوا):',
      '• برای فصل‌ها همیشه حرف اضافه in می‌آید: in spring, in summer, in fall, in winter.',
      '• برای آب‌وهوا: What’s the weather like? → It’s sunny / rainy / windy / snowy.',
      '• برای باران و برف (غیرقابل شمارش): Is there much rain in spring?',
      '• دو تلفظ th: واک‌دار /ð/ مثل there, they و بی‌واک /θ/ مثل north, south, three.',
    ].join('\n');
  }

  if (q.includes('ing') || q.includes('hobby') || q.includes('free time') || q.includes('enjoy') || q.includes('سرگرمی')) {
    return [
      'راهنمای درس ۷ (سرگرمی‌ها و اوقات فراغت):',
      '• بعد از enjoy و همچنین برای نام بردن سرگرمی، فعل به صورت -ing می‌آید: I enjoy searching the Web.',
      '• نکته مهم تلفظی صفحه ۵۷: در آخر کلمات reading, playing, browsing صدای /g/ («گ») تلفظ نمی‌شود!',
    ].join('\n');
  }

  return [
    `پاسخ معلم برای «${lesson.titleFa}» (${lesson.pages}):`,
    `• هدف ارتباطی این درس: ${lesson.functionFa}`,
    `• عبارات کلیدی: ${lesson.keyExpressions.slice(0, 3).join('  |  ')}`,
    'می‌توانید نام یک گرامر، کلمه یا شماره صفحه را بپرسید (مثلاً: تفاوت from و ملیت، تلفظ oo، کاربرد should یا ساختار good at) تا دقیق برایتان توضیح دهم.',
  ].join('\n');
}
