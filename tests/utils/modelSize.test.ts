import { decodedSize } from '../../src/foundation/utils/decodedSize';

const headers = (values: Record<string, string>) => ({
  get: (name: string) => values[name.toLowerCase()] ?? null,
});

test('a pre-compressed model reports its decompressed size, not Content-Length', () => {
  expect(
    decodedSize(
      headers({
        'content-encoding': 'br',
        'content-length': '1050000',
        'x-amz-meta-file-size': '9650000',
      })
    )
  ).toBe(9650000);
});

test('an uncompressed model reports Content-Length', () => {
  expect(decodedSize(headers({ 'content-length': '1403128' }))).toBe(1403128);
});

test('a compressed response without the size is unknown, so the bar shows megabytes', () => {
  expect(decodedSize(headers({ 'content-encoding': 'gzip', 'content-length': '500' }))).toBe(0);
  expect(decodedSize(headers({}))).toBe(0);
});
