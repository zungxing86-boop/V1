Prospect 2 (English Grade 8) - Android TV & Offline Web Bundle
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
