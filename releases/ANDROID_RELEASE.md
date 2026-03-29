# Android release and testing

Run all steps from the **repository root** (the folder that contains `app.config.ts` and `package.json`).

## 1. Automated checks (before any store or APK build)

One shot:

```bash
npm run release:preflight
```

Or step by step:

```bash
npx expo-doctor
npm run typecheck
npm run lint
npm test
```

Fix any failures. `expo-doctor` should pass after using a **single** lockfile (`package-lock.json` only recommended for EAS).

## 2. Version bump

For each release:

- [app.config.ts](../app.config.ts): `version` (user-facing) and `android.versionCode` (**must increase** for every Play upload).
- [package.json](../package.json): `version` (keep in sync if you use it for docs).

Add [releases/v$(VERSION)-github-release-notes.md](./) with user-facing changelog text.

## 3. Local release APK (Gradle)

Uses the Android SDK from `android/local.properties` (`sdk.dir`, e.g. `/home/amansharma/Android/Sdk`). **React Native / Expo Gradle currently expects JDK 17**, not the default **JDK 25** on newer Fedora—either install `java-17-openjdk-devel` or use a [Temurin 17](https://adoptium.net/) unpack under e.g. `~/.local/jdks/jdk-17`.

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export JAVA_HOME="$HOME/.local/jdks/jdk-17"   # or /usr/lib/jvm/java-17-openjdk
cd android
./gradlew assembleRelease
```

APK: `android/app/build/outputs/apk/release/app-release.apk`. Copy to `releases/Sudoku-Ultimatum-<version>-multiabi.apk` and record `sha256sum` in the release notes.

## 4. EAS builds

Prerequisites: [EAS CLI](https://docs.expo.dev/build/setup/), `eas login`, project configured (`eas build:configure` once).

| Goal | Command |
|------|---------|
| **APK** (sideload, internal testers) | `eas build --platform android --profile preview` |
| **AAB** (Google Play) | `eas build --platform android --profile production` |

Profiles are defined in [eas.json](../eas.json): `preview` uses `buildType: "apk"`; `production` uses an app bundle.

After the build, download the artifact from the Expo dashboard and optionally record **SHA256** in your release notes.

## 5. Manual smoke test (device)

Minimum:

- Cold start → home → start game → **complete win** (XP / win screen).
- **Continue** / resume after force-close app.
- Leave-game confirmation + save (in-game back / home).
- **Settings**: sound, reminders, **block invalid notes**, **number pad mode** (bottom vs floating).
- **Branches**: new branch, switch, merge to main, delete; contradiction banner if applicable.
- **Flow**: trigger flow streak, confirm timer/ring; win **in flow** and confirm bonus line if shown.
- **Grid UI**: light and dark mode; on Android, cell ripple and selection elevation inside the card.

Optional: second device (different OEM or older API) for notifications and install quirks.

## 6. Play Store notes

Prefer **staged rollout** for production. APK sideload users should install the `preview` APK matching your documented version.
