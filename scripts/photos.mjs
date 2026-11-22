import sharp from 'sharp';

// These people appear in the shared banner only; never add them to draw.mjs.
export const galleryOnly = ['박세은', '이동재', '홍민화'];

export function findPhoto(files, name) {
  const matches = files.filter(file => ['.jpg', '.jpeg', '.png', '.webp'].some(ext => file.normalize('NFC').toLowerCase() === name.normalize('NFC') + ext));
  if (matches.length > 1) throw new Error(`${name} 사진은 하나만 제공하세요.`);
  return matches[0];
}

export async function preparePhoto(bytes) {
  if (bytes.length > 20 * 1024 * 1024) throw new Error('원본 사진은 20MB 이하로 준비해 주세요.');
  const source = sharp(bytes, { limitInputPixels: 40_000_000 }).rotate();
  // Auto-orient and strip metadata; preserve the complete original composition.
  const portrait = await source.clone().resize({ width: 800, height: 1000, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  const thumbnail = await source.clone().resize({ width: 320, height: 400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 75 }).toBuffer();
  return { portrait, thumbnail };
}
