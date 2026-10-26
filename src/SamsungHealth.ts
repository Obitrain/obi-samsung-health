import type { SamsungHealthApi } from './api';
import { SamsungHealthError } from './errors';

const unsupported = () =>
  Promise.reject(
    new SamsungHealthError(
      'Samsung Health is only available on Android',
      undefined
    )
  );

export const SamsungHealth: SamsungHealthApi = {
  isSupportedPlatform: false,
  getStatus: () => Promise.resolve('unsupportedDevice'),
  resolveStatus: unsupported,
  getGrantedPermissions: () => Promise.resolve([]),
  requestPermissions: unsupported,
  readData: unsupported,
  readChanges: unsupported,
  aggregateDaily: unsupported,
};
