import type { HybridObject } from 'react-native-nitro-modules';

/** Data types this wrapper can read (subset of the SDK's `DataTypes`). */
export type SamsungHealthDataType =
  | 'exercise'
  | 'exerciseLocation'
  | 'heartRate'
  | 'sleep'
  | 'steps'
  | 'activitySummary'
  | 'floorsClimbed'
  | 'bodyComposition'
  | 'bloodOxygen';

/** Types with point data (`readData` / `readChanges`); the others are aggregate-only. */
export type SamsungHealthPointType =
  'exercise' | 'heartRate' | 'sleep' | 'bodyComposition' | 'bloodOxygen';

export type SamsungHealthDailyMetric =
  | 'steps'
  | 'activeCalories'
  | 'totalCalories'
  | 'distance'
  | 'activeTime'
  | 'floorsClimbed';

/**
 * `notInstalled`, `updateRequired`, `disabled` and `notInitialized` are resolvable with
 * `resolveStatus()`. `appNotAllowed`: the app is neither a registered partner nor run with
 * Samsung Health developer mode on (SDK error 2003/2004).
 */
export type SamsungHealthStatus =
  | 'available'
  | 'unsupportedDevice'
  | 'notInstalled'
  | 'updateRequired'
  | 'disabled'
  | 'notInitialized'
  | 'appNotAllowed';

export interface DataPage {
  /** JSON array of points (`SamsungHealthPoint` in `types.ts`). */
  pointsJson: string;
  nextPageToken?: string;
}

export interface ChangesPage {
  /** JSON array of upserted points (`SamsungHealthPoint` in `types.ts`). */
  upsertsJson: string;
  deletedUids: string[];
  nextPageToken?: string;
}

export interface DailyValue {
  /** Local date, YYYY-MM-DD. */
  date: string;
  /** Canonical unit: count (steps, floors), kcal, m, s (activeTime). */
  value: number;
}

/**
 * Promises reject with an Error whose message starts with `[<SDK error code>]` when the SDK
 * raised one; `index.tsx` parses it into a `SamsungHealthError`.
 */
export interface SamsungHealth extends HybridObject<{ android: 'kotlin' }> {
  getStatus(): Promise<SamsungHealthStatus>;

  /** Opens Samsung's install / update / enable flow when the status is resolvable. */
  resolveStatus(): Promise<void>;

  getGrantedPermissions(
    types: SamsungHealthDataType[]
  ): Promise<SamsungHealthDataType[]>;

  /** Shows the Samsung Health consent sheet; resolves with the granted types. */
  requestPermissions(
    types: SamsungHealthDataType[]
  ): Promise<SamsungHealthDataType[]>;

  /** Points whose data time is in [startMs, endMs), oldest first. */
  readData(
    type: SamsungHealthPointType,
    startMs: number,
    endMs: number,
    pageSize: number,
    pageToken?: string
  ): Promise<DataPage>;

  /** Points created, updated or deleted with a change time in [startMs, endMs). */
  readChanges(
    type: SamsungHealthPointType,
    startMs: number,
    endMs: number,
    pageSize: number,
    pageToken?: string
  ): Promise<ChangesPage>;

  /** One value per local day in [startDate, endDate] (YYYY-MM-DD, inclusive). */
  aggregateDaily(
    metric: SamsungHealthDailyMetric,
    startDate: string,
    endDate: string
  ): Promise<DailyValue[]>;
}
