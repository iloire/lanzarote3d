/**
 * A model's size once decompressed, or 0 when unknown. The deploy (scripts/upload-dist.mjs)
 * uploads models brotli-compressed with that size in x-amz-meta-file-size, since Content-Length
 * is then the compressed size while the bytes read are decompressed ones.
 */
export function decodedSize(headers: Pick<Headers, 'get'>): number {
  const size =
    headers.get('x-amz-meta-file-size') ??
    (headers.get('content-encoding') ? null : headers.get('content-length'));
  return Number(size) || 0;
}
