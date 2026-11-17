import React, { useState } from 'react';
import { Check, Copy, Cpu, Download, FileArchive, Layers, Tv, Smartphone, Users } from 'lucide-react';
import { TEXTBOOK_META } from '../data/prospect2';

const ANDROID_MANIFEST_SNIPPET = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- عدم نیاز به صفحه لمسی و سازگاری با Android TV + موبایل -->
    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />
    <uses-feature android:name="android.software.leanback" android:required="false" />
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:banner="@drawable/tv_banner_320x180"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

const CAPACITOR_CONFIG_SNIPPET = `{
  "appId": "ir.edu.prospect2.tvtutor",
  "appName": "Prospect 2 TV Tutor",
  "webDir": "dist",
  "android": {
    "allowMixedContent": false,
    "webContentsDebuggingEnabled": false
  }
}`;

export const TechnicalBlueprintView: React.FC = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  const copyCode = (key: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleDownloadBundle = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setDownloadStatus(null);
    try {
      const res = await fetch('/api/export-bundle');
      if (!res.ok) {
        throw new Error('خطا در دریافت بسته خروجی از سرور');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'prospect2-android-tv-package.zip';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setDownloadStatus('فایل prospect2-android-tv-package.zip با موفقیت دانلود شد.');
    } catch (err) {
      setDownloadStatus(
        err instanceof Error ? err.message : 'امکان دانلود بسته خروجی وجود نداشت.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] px-6 py-6 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
          دریافت خروجی نهایی، مشخصات مخاطب و مراحل ساخت فایل APK (Android TV)
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          دانلود بسته کامل پروژه + فایل‌های کامپایل‌شده آفلاین (dist) + تنظیمات Android TV Leanback برای تولید فایل نصبی APK.
        </p>
      </div>

      {/* 0. Direct Download & Installation Access */}
      <section className="rounded-2xl border border-teal-200 dark:border-teal-900/60 bg-teal-50/50 dark:bg-teal-950/20 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5 text-teal-800 dark:text-teal-300 font-bold text-lg">
              <FileArchive className="h-6 w-6" />
              <h2>دریافت فایل خروجی و تبدیل آسان به APK (بدون نیاز به برنامه‌نویسی)</h2>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              محیط فعلی یک سرور ابری وب است و ابزار کامپایلر اندروید (<span className="font-en font-semibold">Android SDK / Gradle</span>) روی آن نصب نیست؛ بنابراین نمی‌تواند مستقیماً فایل باینری <span className="font-en font-semibold">.apk</span> را داخل همین صفحه بسازد. برای اینکه بدون دانش برنامه‌نویسی و بدون نصب Android Studio فایل APK را تحویل بگیرید، فایل <span className="font-en">build-apk.yml</span> را داخل بسته ZIP قرار داده‌ایم تا در سرویس رایگان GitHub به‌صورت خودکار APK بسازد.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <button
              type="button"
              data-tv-focusable="true"
              onClick={handleDownloadBundle}
              disabled={isDownloading}
              className="inline-flex items-center gap-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 disabled:opacity-60 px-5 py-3.5 text-sm font-bold text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              <Download className="h-5 w-5" />
              <span>
                {isDownloading
                  ? 'در حال آماده‌سازی فایل ZIP...'
                  : 'دانلود بسته کامل پروژه و بیلدر APK (ZIP)'}
              </span>
            </button>
            {downloadStatus && (
              <p className="text-xs font-medium text-teal-800 dark:text-teal-300">
                {downloadStatus}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-teal-200/70 dark:border-teal-900/50 text-xs leading-relaxed">
          <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-teal-100 dark:border-teal-900/40 p-4 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white">
              روش ۱: ساخت خودکار APK بدون نصب برنامه (از طریق مرورگر و GitHub)
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              ۱) بسته ZIP بالا را دانلود و از حالت فشرده خارج کنید.
              <br />
              ۲) در سایت GitHub.com یک مخزن جدید (New Repository) بسازید و فایل‌ها (از جمله پوشه <span className="font-en">.github</span>) را داخل آن آپلود کنید.
              <br />
              ۳) به تب <span className="font-en font-semibold">Actions</span> بروید، گزینه <span className="font-en font-semibold">Build Android TV APK</span> را بزنید و پس از ۲ دقیقه فایل آماده <span className="font-en font-semibold">app-debug.apk</span> را دانلود کنید.
            </p>
          </div>

          <div className="rounded-xl bg-white/80 dark:bg-slate-900/70 border border-teal-100 dark:border-teal-900/40 p-4 space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white">
              روش ۲: نصب فوری بدون نیاز به فایل APK (نسخه آفلاین PWA)
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              لینک مستقیم برنامه را در مرورگر Chrome روی گوشی اندروید یا تلویزیون باز کنید و از منوی مرورگر گزینه
              <span className="font-semibold mx-1">نصب برنامه (Install App / Add to Home Screen)</span>
              را انتخاب کنید تا اپلیکیشن بدون نیاز به اینترنت و دقیقاً مثل یک اپ نصبی اجرا شود.
            </p>
          </div>
        </div>
      </section>

      {/* 1. Target Audience & Grade Level */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ۱. مخاطب هدف و پایه تحصیلی
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">پایه تحصیلی رسمی</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {TEXTBOOK_META.gradeFa}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {TEXTBOOK_META.bookCode} · {TEXTBOOK_META.edition}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">گروه سنی و ویژگی یادگیرنده</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              نوجوانان ۱۳ تا ۱۴ ساله
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              نیازمند آموزش تعاملی، شنیداری-دیداری، فونت درشت تلویزیونی و بازخورد فوری بدون نیاز به معلم خصوصی
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 p-4 space-y-1.5">
            <p className="text-xs text-slate-500 dark:text-slate-400">محیط استفاده</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              تلویزیون اندرویدی (Android TV) در منزل و کلاس هوشمند
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              قابل کنترل با ریموت تلویزیون (D-Pad)، صفحه‌کلید، ماوس و صفحه لمسی
            </p>
          </div>
        </div>
      </section>

      {/* 2. Technical Output & Architecture */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Cpu className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ۲. خروجی فنی و معماری نرم‌افزار
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tv className="h-4 w-4 text-amber-600" />
              <span>لایه رابط کاربری تلویزیونی (Android TV 10-Foot UI)</span>
            </h3>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              <li>• موتور پیمایش فضایی (Spatial D-Pad Navigation) با کلیدهای جهت‌نما، OK و Back ریموت تلویزیون</li>
              <li>• حلقه فوکوس پرکنتراست (Focus Ring) برای مشاهده واضح از فاصله ۳ متری تلویزیون</li>
              <li>• تفکیک کامل جهت متن فارسی (RTL با فونت Vazirmatn) و انگلیسی (LTR با فونت Plus Jakarta Sans)</li>
              <li>• صفحه‌کلید حروف درون‌برنامه‌ای در جدول و تمرین‌ها برای پاسخگویی بدون نیاز به کیبورد فیزیکی</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-600" />
              <span>موتور آفلاین، صوت دوگانه و پایگاه داده محلی</span>
            </h3>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
              <li>• بسته‌بندی کامل محتوای ۷ درس، ۳ مرور و دیکشنری تصویری در ساختار JSON آفلاین</li>
              <li>• Service Worker (PWA Workbox) برای اجرای ۱۰۰٪ بدون اینترنت روی اندروید تی‌وی و تبلت</li>
              <li>• ذخیره‌سازی محلی پیشرفت، نمرات، نقاط ضعف و جعبه‌های لایتنر (Leitner SRS) در حافظه دستگاه</li>
              <li>• پخش صوت دوگانه: صدای استودیویی آنلاین (Gemini TTS) + موتور آفلاین Web Speech / Android TTS همراه با هایلایت همزمان کلمات</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 3. Development Stages & APK Packaging */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Smartphone className="h-6 w-6 text-teal-600 dark:text-teal-400" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            ۳. مراحل توسعه و خروجی گرفتن فایل نصبی APK برای Android TV
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {[
            {
              step: 'فاز ۱ · تحلیل و ساختاردهی محتوا',
              desc: 'استخراج مکالمات، واژگان، گرامر، آواشناسی و تمرین‌های صفحات ۱۲ تا ۹۳ پراسپکت ۲ در مدل داده استاندارد.',
            },
            {
              step: 'فاز ۲ · طراحی UI سازگار با TV',
              desc: 'پیاده‌سازی چیدمان ۱۶:۹ تلویزیونی، حالت شب/روز، فوکوس ریموت کنترل و سیستم راهنمای ۳ مرحله‌ای.',
            },
            {
              step: 'فاز ۳ · موتور صوت و معلم هوشمند',
              desc: 'تلفیق هایلایت همزمان کلمه با صوت، ارزیابی تلفظ، الگوریتم لایتنر و معلم هوشمند آنلاین/آفلاین.',
            },
            {
              step: 'فاز ۴ · بسته‌بندی آفلاین PWA + Capacitor',
              desc: 'تولید باندل نهایی با npm run build و انتقال خودکار پوشه dist به پروژه بومی Android via Capacitor.',
            },
            {
              step: 'فاز ۵ · تنظیم Leanback و ساخت APK',
              desc: 'افزودن LEANBACK_LAUNCHER و بنر TV، امضای Release APK در Android Studio و نصب روی تلویزیون با USB یا ADB.',
            },
          ].map((item, i) => (
            <li
              key={i}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-4 space-y-2"
            >
              <p className="font-bold text-teal-700 dark:text-teal-400">{item.step}</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.desc}</p>
            </li>
          ))}
        </ol>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-4 py-2.5">
              <span className="font-en text-xs font-bold text-slate-800 dark:text-slate-200">
                AndroidManifest.xml (Android TV Leanback)
              </span>
              <button
                type="button"
                data-tv-focusable="true"
                onClick={() => copyCode('manifest', ANDROID_MANIFEST_SNIPPET)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 cursor-pointer"
              >
                {copiedKey === 'manifest' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedKey === 'manifest' ? 'کپی شد' : 'کپی کد'}</span>
              </button>
            </div>
            <pre dir="ltr" className="bg-slate-950 text-slate-100 p-4 text-xs font-ipa overflow-x-auto leading-relaxed">
              {ANDROID_MANIFEST_SNIPPET}
            </pre>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 px-4 py-2.5">
                <span className="font-en text-xs font-bold text-slate-800 dark:text-slate-200">
                  capacitor.config.json & دستورات بیلد APK
                </span>
                <button
                  type="button"
                  data-tv-focusable="true"
                  onClick={() => copyCode('cap', CAPACITOR_CONFIG_SNIPPET)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 dark:text-teal-300 cursor-pointer"
                >
                  {copiedKey === 'cap' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedKey === 'cap' ? 'کپی شد' : 'کپی کد'}</span>
                </button>
              </div>
              <pre dir="ltr" className="bg-slate-950 text-slate-100 p-4 text-xs font-ipa overflow-x-auto leading-relaxed">
                {CAPACITOR_CONFIG_SNIPPET}
              </pre>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 p-4 space-y-2 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-bold text-slate-900 dark:text-white">دستورات ترمینال تولید فایل APK:</p>
              <pre dir="ltr" className="font-ipa text-teal-700 dark:text-teal-400 overflow-x-auto">
                npm install --legacy-peer-deps && npm run build{'\n'}
                npx cap add android && node android-tv/patch-manifest.mjs && npx cap sync android{'\n'}
                cd android && ./gradlew assembleDebug --no-daemon
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
