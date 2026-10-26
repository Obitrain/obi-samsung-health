/** SDK `ErrorCode` values worth branching on. */
export const SamsungHealthErrorCode = {
  NO_USER_PERMISSION: 2000,
  ACCESS_CONTROL: 2003,
  INVALID_PLATFORM_SIGNATURE: 2004,
  PLATFORM_NOT_INSTALLED: 3000,
  OLD_VERSION_PLATFORM: 3001,
  PLATFORM_DISABLED: 3002,
  PLATFORM_NOT_INITIALIZED: 3003,
  CONNECTION_FAIL: 9004,
  CONNECTION_TIMEOUT: 9006,
  PLATFORM_DISCONNECTED: 9007,
} as const;

export class SamsungHealthError extends Error {
  /** SDK error code, undefined for non-SDK failures (no activity, unsupported device...). */
  readonly code: number | undefined;

  constructor(message: string, code: number | undefined) {
    super(message);
    this.name = 'SamsungHealthError';
    this.code = code;
  }
}

const CODE_PREFIX = /^\[(\d+)\]\s*/;

/** Turns a native rejection (`[<code>] message`, see SamsungHealth.kt) into a SamsungHealthError. */
export const toSamsungHealthError = (error: unknown): SamsungHealthError => {
  if (error instanceof SamsungHealthError) return error;
  const message = error instanceof Error ? error.message : String(error);
  const match = CODE_PREFIX.exec(message);
  return new SamsungHealthError(
    match ? message.slice(match[0].length) : message,
    match ? Number(match[1]) : undefined
  );
};
