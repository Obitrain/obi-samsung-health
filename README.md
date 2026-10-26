# @obitrain/react-native-samsung-health

React Native wrapper (Nitro module, Kotlin) around the [Samsung Health Data SDK](https://developer.samsung.com/health/data/overview.html) v1.1: permissions, point reads, change reads and daily aggregates. Android only; other platforms get a stub reporting `unsupportedDevice`.

## Install

```sh
yarn add @obitrain/react-native-samsung-health react-native-nitro-modules
```

The SDK `.aar` is not on Maven and is not shipped in this package. The library compiles against it; the app ships it:

1. Download the SDK from <https://developer.samsung.com/health/data/process.html> (Samsung account required) and put the `.aar` in `android/app/libs/`. The library picks up `app/libs/*health-data-api*.aar`, or `-PsamsungHealthSdkAar=<path>`.
2. In `android/app/build.gradle`: `implementation fileTree(dir: "libs", include: ["*.aar"])`.
3. The SDK needs Android 10 (API 29). With a lower app `minSdkVersion`, add to `AndroidManifest.xml` (`xmlns:tools`): `<uses-sdk tools:overrideLibrary="com.samsung.android.sdk.health.data" />`. The wrapper checks the API level at runtime.

## Usage

```ts
import { SamsungHealth } from '@obitrain/react-native-samsung-health';

const status = await SamsungHealth.getStatus(); // 'available' | 'notInstalled' | 'appNotAllowed' | ...
if (status === 'notInstalled' || status === 'updateRequired') await SamsungHealth.resolveStatus();

await SamsungHealth.requestPermissions(['exercise', 'exerciseLocation', 'sleep', 'steps']);

// first sync: by data time
const { points, nextPageToken } = await SamsungHealth.readData('exercise', { startMs, endMs });
// later syncs: by change time (upserts + deletions)
const { upserts, deletedUids } = await SamsungHealth.readChanges('exercise', { startMs: lastSync, endMs: now });

const steps = await SamsungHealth.aggregateDaily('steps', '2026-10-20', '2026-10-26');
```

Point shapes are in [`src/types.ts`](src/types.ts) (epoch ms, seconds, SDK canonical units). Errors are `SamsungHealthError` with the SDK `code` (see `SamsungHealthErrorCode`).

## Developer mode and partnership

Without Samsung partner approval the SDK rejects every call with `2003` (`getStatus()` → `appNotAllowed`). For read testing, enable developer mode on the phone: Samsung Health › ⋮ › Settings › About Samsung Health, tap the version 10+ times, then turn on **Developer Mode for Data Read**. Shipping to users needs a [partnership request](https://developer.samsung.com/health/partnerships) with the package name and release signing SHA-256.

## Example app

```sh
# put the SDK aar in libs/ first
yarn install
yarn example prebuild --clean
yarn example android
```

Emulators are not supported by the SDK; use a Samsung phone with Samsung Health ≥ 6.30.2.
