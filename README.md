# Sudoku Ultimatum

Offline Sudoku for Android and iOS, built with [Expo](https://expo.dev/) (React Native). No network access is required to play; progress is stored on-device with AsyncStorage.

## Requirements

- Node.js 22+ (see CI)
- npm

## Development

```bash
npm ci
npm start
```

In another terminal, press `a` for Android or scan the QR code for Expo Go.

```bash
npx expo run:android
```

## Tests & quality

```bash
npm run lint
npm run typecheck
npm test
```

## Android Play Store build (EAS)

1. Replace `android.package` in [app.config.ts](app.config.ts) with your own reverse-DNS id (e.g. `com.yourorg.sudoku`).
2. Bump `version` and `android.versionCode` for each Play release.
3. Install EAS CLI and log in: `npm install -g eas-cli && eas login`
4. Configure the project: `eas build:configure`
5. Production AAB: `eas build -p android --profile production`
6. Submit: `eas submit -p android --latest` (or upload the `.aab` manually in Play Console).

See [EAS Build](https://docs.expo.dev/build/introduction/) and [Submit to Google Play](https://docs.expo.dev/submit/android/).

## Privacy

The app does not send game data to remote servers. Settings and progress stay on the device.

## License

MIT — see [LICENSE](LICENSE).

The `legacy/` folder contains an old web prototype and is not used by the mobile app.
