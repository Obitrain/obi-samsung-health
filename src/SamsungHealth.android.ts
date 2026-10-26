import { NitroModules } from 'react-native-nitro-modules';
import { DEFAULT_PAGE_SIZE, type SamsungHealthApi } from './api';
import { toSamsungHealthError } from './errors';
import type { SamsungHealth as NativeSamsungHealth } from './SamsungHealth.nitro';

let _native: NativeSamsungHealth | undefined;
const native = (): NativeSamsungHealth => {
  _native ??=
    NitroModules.createHybridObject<NativeSamsungHealth>('SamsungHealth');
  return _native;
};

const call = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (error) {
    throw toSamsungHealthError(error);
  }
};

export const SamsungHealth: SamsungHealthApi = {
  isSupportedPlatform: true,
  getStatus: () => call(() => native().getStatus()),
  resolveStatus: () => call(() => native().resolveStatus()),
  getGrantedPermissions: (types) =>
    call(() => native().getGrantedPermissions(types)),
  requestPermissions: (types) => call(() => native().requestPermissions(types)),
  readData: (type, { startMs, endMs, pageSize, pageToken }) =>
    call(async () => {
      const page = await native().readData(
        type,
        startMs,
        endMs,
        pageSize ?? DEFAULT_PAGE_SIZE,
        pageToken
      );
      return {
        points: JSON.parse(page.pointsJson),
        nextPageToken: page.nextPageToken,
      };
    }),
  readChanges: (type, { startMs, endMs, pageSize, pageToken }) =>
    call(async () => {
      const page = await native().readChanges(
        type,
        startMs,
        endMs,
        pageSize ?? DEFAULT_PAGE_SIZE,
        pageToken
      );
      return {
        upserts: JSON.parse(page.upsertsJson),
        deletedUids: page.deletedUids,
        nextPageToken: page.nextPageToken,
      };
    }),
  aggregateDaily: (metric, startDate, endDate) =>
    call(() => native().aggregateDaily(metric, startDate, endDate)),
};
