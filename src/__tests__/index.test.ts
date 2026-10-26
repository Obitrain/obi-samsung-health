import { describe, expect, it, jest } from '@jest/globals';
import { SamsungHealthError, toSamsungHealthError } from '../errors';
import { SamsungHealth } from '../SamsungHealth.android';

const mockNative = {
  readData: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  readChanges: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getStatus: jest.fn<() => Promise<unknown>>(),
};

jest.mock('react-native-nitro-modules', () => ({
  NitroModules: { createHybridObject: () => mockNative },
}));

describe('toSamsungHealthError', () => {
  it.each([
    {
      id: 'sdk code prefix',
      input: new Error('[2003] Permission not allowed due to SDK policy error'),
      code: 2003,
      message: 'Permission not allowed due to SDK policy error',
    },
    {
      id: 'no prefix',
      input: new Error('No foreground activity'),
      code: undefined,
      message: 'No foreground activity',
    },
    {
      id: 'non-error rejection',
      input: 'boom',
      code: undefined,
      message: 'boom',
    },
  ])('$id', ({ input, code, message }) => {
    const error = toSamsungHealthError(input);
    expect(error).toBeInstanceOf(SamsungHealthError);
    expect(error.code).toBe(code);
    expect(error.message).toBe(message);
  });
});

describe('SamsungHealth (android)', () => {
  it('decodes points and passes the default page size', async () => {
    mockNative.readData.mockResolvedValueOnce({
      pointsJson: '[{"uid":"a","start_time":1,"sessions":[]}]',
      nextPageToken: 'next',
    });
    const page = await SamsungHealth.readData('exercise', {
      startMs: 0,
      endMs: 10,
    });
    expect(mockNative.readData).toHaveBeenCalledWith(
      'exercise',
      0,
      10,
      500,
      undefined
    );
    expect(page).toEqual({
      points: [{ uid: 'a', start_time: 1, sessions: [] }],
      nextPageToken: 'next',
    });
  });

  it('decodes upserts and keeps tombstones', async () => {
    mockNative.readChanges.mockResolvedValueOnce({
      upsertsJson: '[]',
      deletedUids: ['gone'],
    });
    await expect(
      SamsungHealth.readChanges('sleep', { startMs: 0, endMs: 10 })
    ).resolves.toEqual({ upserts: [], deletedUids: ['gone'] });
  });

  it('maps native rejections to SamsungHealthError', async () => {
    mockNative.getStatus.mockRejectedValueOnce(new Error('[9004] connection'));
    await expect(SamsungHealth.getStatus()).rejects.toMatchObject({
      name: 'SamsungHealthError',
      code: 9004,
    });
  });
});
