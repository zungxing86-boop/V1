import fs from 'fs';
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
      '    <uses-feature android:name="android.hardware.touchscreen" android:required="false" />\n    <uses-feature android:name="android.software.leanback" android:required="false" />\n</manifest>'
    );
  }
  if (hasBanner && !xml.includes('android:banner=')) {
    xml = xml.replace(
      '<application',
      '<application\n        android:banner="@drawable/tv_banner_320x180"'
    );
  }
  if (!xml.includes('LEANBACK_LAUNCHER')) {
    xml = xml.replace(
      '<category android:name="android.intent.category.LAUNCHER" />',
      '<category android:name="android.intent.category.LAUNCHER" />\n                <category android:name="android.intent.category.LEANBACK_LAUNCHER" />'
    );
  }
  fs.writeFileSync(manifestPath, xml, 'utf8');
  console.log('Patched AndroidManifest.xml for Android TV successfully.');
}
