/**
 * Upload a built site to S3 with its models pre-compressed.
 *
 * CloudFront compresses HTML and JS on the fly, but not .glb or .obj (their content types are not
 * on its list, and it never compresses a file over 10 MB). So the models are brotli-compressed
 * here and uploaded with `Content-Encoding: br`; the browser decompresses them transparently.
 * Their decompressed size goes in `x-amz-meta-file-size`, which Models (src/foundation/utils/
 * models.ts) reads for the loading percentage, since Content-Length is now the compressed size.
 *
 * Pages go up as no-cache and the content-hashed bundles as immutable; everything else as is.
 * Pages go up last and nothing is deleted, so the live site never breaks mid-deploy. Compressed
 * copies are written to a temp dir, so `dist/` stays servable locally (`npm run run-prod`).
 *
 * Usage: node scripts/upload-dist.mjs <dist dir> <bucket> <aws profile>
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { execFileSync } from 'child_process';

const CONTENT_TYPES = { '.glb': 'model/gltf-binary', '.obj': 'text/plain' };

const [dist, bucket, profile] = process.argv.slice(2);
if (!dist || !bucket || !profile) {
  console.error('Usage: node scripts/upload-dist.mjs <dist dir> <bucket> <aws profile>');
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function aws(...args) {
  execFileSync('aws', [...args, '--profile', profile], { stdio: 'inherit' });
}

const models = walk(dist).filter(file => path.extname(file) in CONTENT_TYPES);
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-dist-'));

// Upload order is what keeps the live site working mid-deploy: what the pages depend on goes up
// first and the pages themselves last, so a visitor sees either the old site or the new one,
// never a new page pointing at a bundle that isn't there yet. Nothing is deleted, so a page
// already open can still lazy-load its old chunks.

// 1. Everything but pages, bundles and models, as is
aws(
  's3',
  'cp',
  dist,
  `s3://${bucket}`,
  '--recursive',
  ...['*.html', '*.js', ...Object.keys(CONTENT_TYPES).map(ext => `*${ext}`)].flatMap(pattern => [
    '--exclude',
    pattern,
  ])
);

// 2. Models, brotli-compressed
let before = 0;
let after = 0;
for (const file of models) {
  const raw = fs.readFileSync(file);
  const br = zlib.brotliCompressSync(raw, {
    params: {
      [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
      [zlib.constants.BROTLI_PARAM_SIZE_HINT]: raw.length,
    },
  });
  const key = path.relative(dist, file).split(path.sep).join('/');
  const staged = path.join(stage, path.basename(file));
  fs.writeFileSync(staged, br);
  aws(
    's3',
    'cp',
    staged,
    `s3://${bucket}/${key}`,
    '--content-encoding',
    'br',
    '--content-type',
    CONTENT_TYPES[path.extname(file)],
    '--metadata',
    `file-size=${raw.length}`
  );
  before += raw.length;
  after += br.length;
}

// 3. Bundles, then 4. pages. The bundles are named by their content (webpack.config.js), so a
// browser can keep them for good; the pages are checked on every visit, so a deploy shows up
// straight away.
for (const [pattern, cacheControl] of [
  ['*.js', 'public, max-age=31536000, immutable'],
  ['*.html', 'no-cache'],
]) {
  aws(
    's3',
    'cp',
    dist,
    `s3://${bucket}`,
    '--recursive',
    '--exclude',
    '*',
    '--include',
    pattern,
    '--cache-control',
    cacheControl
  );
}

fs.rmSync(stage, { recursive: true, force: true });
const mb = bytes => (bytes / 1e6).toFixed(1);
console.log(`${models.length} models: ${mb(before)} MB → ${mb(after)} MB with brotli`);
