import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { findPhoto, preparePhoto } from '../scripts/photos.mjs';
import { participants } from '../scripts/draw.mjs';
import { decrypt } from '../shared/crypto.mjs';

test('photo filenames support macOS decomposed Korean and uppercase extensions', () => {
  const file = '유태승'.normalize('NFD') + '.JPEG';
  assert.equal(findPhoto([file], '유태승'), file);
  assert.equal(findPhoto(['박세은.png'], '유태승'), undefined);
  assert.throws(() => findPhoto([file, '유태승.jpg'], '유태승'));
});

test('photo preparation auto-orients, bounds size, and removes source metadata', async () => {
  const input = await sharp({ create: { width: 1600, height: 1200, channels: 3, background: '#bd2940' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const { portrait, thumbnail } = await preparePhoto(input);
  const full = await sharp(portrait).metadata();
  const small = await sharp(thumbnail).metadata();
  assert.equal(full.format, 'webp');
  assert.ok(full.height > full.width);
  assert.ok(full.width <= 800 && full.height <= 1000);
  assert.ok(small.width <= 320 && small.height <= 400);
  assert.equal(full.exif, undefined);
  assert.equal(small.exif, undefined);
  await assert.rejects(() => preparePhoto(Buffer.from('invalid photo')));
});

test('19 banner photos exist while all 19 private results remain participant-only with photos', async () => {
  const gallery = JSON.parse(await readFile(new URL('../src/data/friends.json', import.meta.url), 'utf8'));
  assert.equal(gallery.length, 19);
  assert.deepEqual(gallery.map(item => item.name).sort(), [...participants].sort());
  for (const item of gallery) {
    const bytes = await readFile(new URL(`../public${item.src}`, import.meta.url));
    assert.equal((await sharp(bytes).metadata()).format, 'webp');
    assert.ok(bytes.length < 150000);
  }
  const deliveries = JSON.parse(await readFile(new URL('../.private/delivery.json', import.meta.url), 'utf8'));
  for (const { id, key } of deliveries) {
    const envelope = JSON.parse(await readFile(new URL(`../public/results/${id}.json`, import.meta.url), 'utf8'));
    const result = await decrypt(envelope, key);
    assert.ok(participants.includes(result.recipient), 'Recipient must be one of the 19 participants');
    assert.ok(result.photo?.startsWith('data:image/webp;base64,'), 'Every recipient must have a photo');
    const metadata = await sharp(Buffer.from(result.photo.split(',')[1], 'base64')).metadata();
    assert.ok(metadata.width <= 800 && metadata.height <= 1000);
  }
});
