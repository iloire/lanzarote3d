/**
 * Delete files from the bucket that the current build no longer has.
 *
 * Deploys never empty the bucket (upload-dist.mjs), so files a build stops producing stay
 * behind. Every deploy re-uploads every current file, so anything in the bucket but not in the
 * build is unused. It is only deleted once it has been untouched for GRACE_DAYS, so a tab still
 * open on an earlier deploy can load its old chunks.
 *
 * Usage: node scripts/prune-bucket.mjs <dist dir> <bucket> <aws profile> [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

const GRACE_DAYS = 7;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const [dist, bucket, profile] = args.filter(arg => arg !== '--dry-run');
if (!dist || !bucket || !profile) {
  console.error(
    'Usage: node scripts/prune-bucket.mjs <dist dir> <bucket> <aws profile> [--dry-run]'
  );
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function aws(...args) {
  return execFileSync('aws', [...args, '--profile', profile, '--output', 'json'], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
}

const built = new Set(walk(dist).map(file => path.relative(dist, file).split(path.sep).join('/')));
if (built.size === 0) {
  console.error(`${dist} is empty, refusing to prune`);
  process.exit(1);
}

// The CLI follows the pagination itself and prints every object in one list
const objects = JSON.parse(aws('s3api', 'list-objects-v2', '--bucket', bucket)).Contents ?? [];
const cutoff = Date.now() - GRACE_DAYS * 24 * 60 * 60 * 1000;
const stale = objects.filter(
  object => !built.has(object.Key) && new Date(object.LastModified).getTime() < cutoff
);
const waiting = objects.filter(object => !built.has(object.Key)).length - stale.length;

for (const object of stale) {
  console.log(`${dryRun ? 'would delete' : 'delete'} ${object.Key}`);
}
// delete-objects takes at most 1000 keys a call
for (let i = 0; !dryRun && i < stale.length; i += 1000) {
  const batch = {
    Objects: stale.slice(i, i + 1000).map(object => ({ Key: object.Key })),
    Quiet: true,
  };
  aws('s3api', 'delete-objects', '--bucket', bucket, '--delete', JSON.stringify(batch));
}

const mb = (stale.reduce((sum, object) => sum + object.Size, 0) / 1e6).toFixed(1);
console.log(
  `${dryRun ? 'Would delete' : 'Deleted'} ${stale.length} stale files (${mb} MB); ` +
    `${waiting} more unused but younger than ${GRACE_DAYS} days`
);
