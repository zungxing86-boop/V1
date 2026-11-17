import express from 'express';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) !== 0 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

interface ZipEntryInput {
  name: string;
  data: Buffer;
}

function buildZipBuffer(entries: ZipEntryInput[]): Buffer {
  const localChunks: Buffer[] = [];
  const centralChunks: Buffer[] = [];
  let offset = 0;

  const now = new Date();
  const dosTime =
    ((now.getHours() & 0x1f) << 11) |
    ((now.getMinutes() & 0x3f) << 5) |
    ((now.getSeconds() >> 1) & 0x1f);
  const dosDate =
    (((Math.max(1980, now.getFullYear()) - 1980) & 0x7f) << 9) |
    (((now.getMonth() + 1) & 0x0f) << 5) |
    (now.getDate() & 0x1f);

  for (const entry of entries) {
    const fileNameBuf = Buffer.from(entry.name.replace(/\\/g, '/'), 'utf8');
    const rawData = entry.data;
    const rawCrc = crc32(rawData);
    const compressed = rawData.length > 0 ? zlib.deflateRawSync(rawData, { level: 6 }) : rawData;
    const useDeflate = compressed.length < rawData.length;
    const method = useDeflate ? 8 : 0;
    const payload = useDeflate ? compressed : rawData;

    // Local File Header (30 bytes + filename)
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0x0800, 6); // UTF-8 flag
    localHeader.writeUInt16LE(method, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(rawCrc, 14);
    localHeader.writeUInt32LE(payload.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(fileNameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28); // extra len

    localChunks.push(localHeader, fileNameBuf, payload);

    // Central Directory Header (46 bytes + filename)
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0x0800, 8); // UTF-8 flag
    centralHeader.writeUInt16LE(method, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(rawCrc, 16);
    centralHeader.writeUInt32LE(payload.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(fileNameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42);

    centralChunks.push(centralHeader, fileNameBuf);
    offset += 30 + fileNameBuf.length + payload.length;
  }

  const centralDirBuf = Buffer.concat(centralChunks);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralDirBuf.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localChunks, centralDirBuf, eocd]);
}

function collectFilesRecursively(dirPath: string, zipPrefix: string, out: ZipEntryInput[]) {
  if (!fs.existsSync(dirPath)) return;
  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const item of items) {
    if (item.name === 'node_modules' || item.name === '.git' || item.name === 'aistudio') continue;
    const fullPath = path.join(dirPath, item.name);
    const entryName = zipPrefix ? `${zipPrefix}/${item.name}` : item.name;
    if (item.isDirectory()) {
      collectFilesRecursively(fullPath, entryName, out);
    } else if (item.isFile()) {
      out.push({ name: entryName, data: fs.readFileSync(fullPath) });
    }
  }
}

const EXPORT_CAPACITOR_CONFIG = `{
  "appId": "ir.edu.prospect2.tvtutor",
  "appName": "Prospect 2 TV Tutor",
  "webDir": "dist",
  "android": {
    "allowMixedContent": false,
    "webContentsDebuggingEnabled": false
  }
}
`;

const EXPORT_ANDROID_MANIFEST = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

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
</manifest>
`;

const EXPORT_PATCH_SCRIPT = `import fs from 'fs';
import path from 'path';

const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');
const drawableDir = path.join('android', 'app', 'src', 'main', 'res', 'drawable');
const bannerDest = path.join(drawableDir, 'tv_banner_320x180.png');

const bannerSrc = fs.existsSync('public/pwa-512x512.png')
  ? 'public/pwa-512x512.png'
  : fs.existsSync('dist/pwa-512x512.png')
    ? 'dist/pwa-512x512.png'
    : null;

let hasBanner = false;
if (bannerSrc) {
  fs.mkdirSync(drawableDir, { recursive: true });
  fs.copyFileSync(bannerSrc, bannerDest);
  hasBanner = true;
}

if (fs.existsSync(manifestPath)) {
  let xml = fs.readFileSync(manifestPath, 'utf8');
  if (!xml.includes('android.hardware.touchscreen')) {
    xml = xml.replace(
      '</manifest>',
      '    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\\n    <uses-feature android:name="android.software.leanback" android:required="false" />\\n</manifest>'
    );
  }
  if (hasBanner && !xml.includes('android:banner=')) {
    xml = xml.replace(
      '<application',
      '<application\\n        android:banner="@drawable/tv_banner_320x180"'
    );
  }
  if (!xml.includes('LEANBACK_LAUNCHER')) {
    xml = xml.replace(
      '<category android:name="android.intent.category.LAUNCHER" />',
      '<category android:name="android.intent.category.LAUNCHER" />\\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />'
    );
  }
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('Patched AndroidManifest.xml for Android TV successfully.');
}
`;

const EXPORT_GITHUB_WORKFLOW = `name: Build Android TV APK

on:
  workflow_dispatch:
  push:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Setup Java 21
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Ensure valid Capacitor JSON config and build web bundle
        run: |
          rm -f capacitor.config.ts
          if [ ! -f "capacitor.config.json" ]; then
            echo '{"appId":"ir.edu.prospect2.tvtutor","appName":"Prospect 2 TV Tutor","webDir":"dist"}' > capacitor.config.json
          fi
          if [ ! -f "dist/index.html" ]; then
            npm install --legacy-peer-deps
            npm run build
          fi
          npm install --legacy-peer-deps @capacitor/core@^7.4.0 @capacitor/cli@^7.4.0 @capacitor/android@^7.4.0

      - name: Generate and configure Android TV project
        run: |
          rm -rf android
          npx cap add android
          if [ -f "android-tv/patch-manifest.mjs" ]; then
            node android-tv/patch-manifest.mjs
          else
            node -e 'const fs=require("fs"),p="android/app/src/main/AndroidManifest.xml",d="android/app/src/main/res/drawable",b=fs.existsSync("public/pwa-512x512.png")?"public/pwa-512x512.png":fs.existsSync("dist/pwa-512x512.png")?"dist/pwa-512x512.png":null;let hb=false;if(b){fs.mkdirSync(d,{recursive:true});fs.copyFileSync(b,d+"/tv_banner_320x180.png");hb=true}let x=fs.readFileSync(p,"utf8");if(!x.includes("android.hardware.touchscreen"))x=x.replace("</manifest>","    <uses-feature android:name=\\"android.hardware.touchscreen\\" android:required=\\"false\\" />\\n    <uses-feature android:name=\\"android.software.leanback\\" android:required=\\"false\\" />\\n</manifest>");if(hb&&!x.includes("android:banner="))x=x.replace("<application","<application\\n        android:banner=\\"@drawable/tv_banner_320x180\\"");if(!x.includes("LEANBACK_LAUNCHER"))x=x.replace("<category android:name=\\"android.intent.category.LAUNCHER\\" />","<category android:name=\\"android.intent.category.LAUNCHER\\" />\\n                <category android:name=\\"android.intent.category.LEANBACK_LAUNCHER\\" />");fs.writeFileSync(p,x);'
          fi
          npx cap sync android

      - name: Build Android TV APK
        run: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --no-daemon

      - name: Upload APK artifact
        uses: actions/upload-artifact@v4
        with:
          name: Prospect2-AndroidTV-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk
`;

const EXPORT_README_APK = `Prospect 2 (English Grade 8) - Android TV & Offline Web Bundle
==================================================================

Option 1 (No Coding / No Android Studio Required - Cloud Build via GitHub):
1. Extract this ZIP archive completely (including the hidden ".github" folder!).
2. Create a free repository on GitHub.com and upload the CONTENTS of the folder
   to the root of the repository (so ".github/workflows/build-apk.yml" is at root).
3. Go to the "Actions" tab in GitHub -> select "Build Android TV APK" -> click "Run workflow".
4. Download "Prospect2-AndroidTV-APK" (.zip containing app-debug.apk) from Artifacts!

Option 2 (Local Build on Your Computer):
1. Install Node.js (v22+), Java JDK 21, and Android Studio (with Android SDK).
2. Extract this ZIP and run inside the folder:
   npm install --legacy-peer-deps
   npm install --legacy-peer-deps @capacitor/core@^7.4.0 @capacitor/cli@^7.4.0 @capacitor/android@^7.4.0
   npm run build
   npx cap add android
   npx cap sync android
3. Build the APK:
   cd android && ./gradlew assembleDebug --no-daemon
   Output path: android/app/build/outputs/apk/debug/app-debug.apk
`;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, aiConfigured: Boolean(getAIClient()) });
  });

  app.get('/api/export-bundle', (_req, res) => {
    try {
      const entries: ZipEntryInput[] = [];
      const rootFiles = [
        'package.json',
        'index.html',
        'tsconfig.json',
        'vite.config.ts',
        'metadata.json',
        'server.ts',
        '.env.example',
      ];
      for (const fileName of rootFiles) {
        const fullPath = path.join(__dirname, fileName);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
          entries.push({ name: fileName, data: fs.readFileSync(fullPath) });
        }
      }

      collectFilesRecursively(path.join(__dirname, 'dist'), 'dist', entries);
      collectFilesRecursively(path.join(__dirname, 'src'), 'src', entries);
      collectFilesRecursively(path.join(__dirname, 'public'), 'public', entries);

      entries.push({
        name: 'capacitor.config.json',
        data: Buffer.from(EXPORT_CAPACITOR_CONFIG, 'utf8'),
      });
      entries.push({
        name: 'android-tv/AndroidManifest.xml',
        data: Buffer.from(EXPORT_ANDROID_MANIFEST, 'utf8'),
      });
      entries.push({
        name: 'android-tv/patch-manifest.mjs',
        data: Buffer.from(EXPORT_PATCH_SCRIPT, 'utf8'),
      });
      entries.push({
        name: '.github/workflows/build-apk.yml',
        data: Buffer.from(EXPORT_GITHUB_WORKFLOW, 'utf8'),
      });
      entries.push({
        name: 'README-APK.txt',
        data: Buffer.from(EXPORT_README_APK, 'utf8'),
      });

      const zipBuffer = buildZipBuffer(entries);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="prospect2-android-tv-package.zip"'
      );
      res.setHeader('Content-Length', String(zipBuffer.length));
      return res.send(zipBuffer);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ساخت بسته خروجی';
      return res.status(500).json({ error: message });
    }
  });

  app.post('/api/tutor/ask', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'کلید هوش مصنوعی پیکربندی نشده است. از راهنمای آموزشی داخلی برنامه استفاده می‌شود.',
      });
    }

    const { question, lessonTitle, contextSummary } = req.body ?? {};
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'پرسش معتبر ارسال نشده است.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Lesson Context: ${lessonTitle || 'Prospect 2 Grade 8'}\nDetails: ${contextSummary || ''}\n\nStudent Question: ${question}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are a warm, encouraging Iranian 8th-grade English teacher specializing in the official textbook "Prospect 2 (English for Schools - Grade 8)". Answer in clear, simple Persian (Farsi) with clear English examples. Keep explanations concise, step-by-step, and suitable for a 13-14 year old student watching on Android TV. Include a short check-your-understanding tip at the end.',
        },
      });

      return res.json({ answer: response.text ?? '' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطای ارتباط با معلم هوشمند';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/tutor/evaluate', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({
        error: 'سرویس آنلاین هوش مصنوعی در دسترس نیست.',
      });
    }

    const { prompt, expectedAnswer, studentAnswer, ruleHint } = req.body ?? {};
    if (!studentAnswer || typeof studentAnswer !== 'string') {
      return res.status(400).json({ error: 'پاسخ دانش‌آموز ارسال نشده است.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Task: ${prompt}\nExpected / Model Answer: ${expectedAnswer}\nGrammar/Spelling Rule: ${ruleHint}\nStudent Answer: ${studentAnswer}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'You are an 8th-grade Iranian English teacher for Prospect 2. Evaluate the student answer fairly. Accept valid grammatical variants (like contractions I am / I\'m). Provide encouraging, crystal-clear feedback in Persian explaining WHY it is right or wrong, plus a helpful tip.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isCorrect: { type: Type.BOOLEAN },
              persianFeedback: { type: Type.STRING },
              grammarTip: { type: Type.STRING },
              correctedSentence: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در ارزیابی پاسخ';
      return res.status(502).json({ error: message });
    }
  });

  app.post('/api/tts', async (req, res) => {
    const ai = getAIClient();
    if (!ai) {
      return res.status(503).json({ error: 'سرویس صوتی آنلاین در دسترس نیست.' });
    }

    const { text, style } = req.body ?? {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'متن انگلیسی ارسال نشده است.' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text,
                speechMetadata: {
                  style: style || 'Clear, friendly English teacher speaking slowly for 8th-grade learners',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(502).json({ error: 'صوت تولید نشد.' });
      }

      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطا در تولید صوت';
      return res.status(502).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prospect 2 Smart TV Tutor running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
