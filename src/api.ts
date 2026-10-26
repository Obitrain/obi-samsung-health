import type {
  SamsungHealthDailyMetric,
  SamsungHealthDataType,
  SamsungHealthPointType,
  SamsungHealthStatus,
  DailyValue,
} from './SamsungHealth.nitro';
import type { SamsungHealthPointMap } from './types';

export interface ReadOptions {
  startMs: number;
  endMs: number;
  /** Default 500. */
  pageSize?: number;
  pageToken?: string;
}

export interface PointsPage<T extends SamsungHealthPointType> {
  points: SamsungHealthPointMap[T][];
  nextPageToken?: string;
}

export interface ChangesResult<T extends SamsungHealthPointType> {
  upserts: SamsungHealthPointMap[T][];
  deletedUids: string[];
  nextPageToken?: string;
}

/** Same surface on every platform; off Android it reports `unsupportedDevice`. */
export interface SamsungHealthApi {
  readonly isSupportedPlatform: boolean;
  getStatus(): Promise<SamsungHealthStatus>;
  resolveStatus(): Promise<void>;
  getGrantedPermissions(
    types: SamsungHealthDataType[]
  ): Promise<SamsungHealthDataType[]>;
  requestPermissions(
    types: SamsungHealthDataType[]
  ): Promise<SamsungHealthDataType[]>;
  readData<T extends SamsungHealthPointType>(
    type: T,
    options: ReadOptions
  ): Promise<PointsPage<T>>;
  readChanges<T extends SamsungHealthPointType>(
    type: T,
    options: ReadOptions
  ): Promise<ChangesResult<T>>;
  aggregateDaily(
    metric: SamsungHealthDailyMetric,
    startDate: string,
    endDate: string
  ): Promise<DailyValue[]>;
}

export const DEFAULT_PAGE_SIZE = 500;
