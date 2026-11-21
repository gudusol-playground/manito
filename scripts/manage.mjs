import { mkdir, readFile, writeFile, access, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { draw, participants } from './draw.mjs';
import { randomToken, encrypt, decrypt } from '../shared/crypto.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const privateDir = join(root, '.private');
const publicDir = join(root, 'public', 'results');
const manifestPath = join(privateDir, 'delivery.json');
const exists = async path => access(path).then(() => true, () => false);
const command = process.argv[2];

async function main() {
  if (command === 'init') {
    if (await exists(manifestPath) || await exists(publicDir)) throw new Error('기존 추첨 또는 결과가 있습니다. 덮어쓰지 않았습니다. 재배포에는 초기화를 실행하지 마세요.');
    await mkdir(privateDir, { recursive: true, mode: 0o700 });
    await mkdir(publicDir, { recursive: true });
    const deliveries = [];
    for (const result of draw(participants)) {
      const id = randomToken(16);
      const key = randomToken();
      const envelope = await encrypt(result, key);
      await writeFile(join(publicDir, `${id}.json`), JSON.stringify(envelope), { flag: 'wx' });
      deliveries.push({ name: result.sender, id, key });
    }
    deliveries.sort((a, b) => participants.indexOf(a.name) - participants.indexOf(b.name));
    await writeFile(manifestPath, JSON.stringify(deliveries, null, 2), { flag: 'wx', mode: 0o600 });
    console.log('16명의 고정 매칭을 생성했습니다. 결과는 공개하지 않았습니다. .private 폴더를 안전하게 백업하세요.');
  } else if (command === 'links') {
    const url = new URL(process.argv[3] || 'http://localhost:5173');
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('사이트의 기본 주소만 입력하세요. 예: https://example.vercel.app');
    const deliveries = JSON.parse(await readFile(manifestPath, 'utf8'));
    const rows = deliveries.map(({ name, id, key }) => `${name}\t${url.origin}/#${id}.${key}`);
    await writeFile(join(privateDir, 'links.txt'), rows.join('\n') + '\n', { mode: 0o600 });
    console.log('개인 링크 목록을 .private/links.txt에 저장했습니다. 상대 이름은 포함되지 않습니다.');
  } else if (command === 'photos') {
    if (!process.argv[3]) throw new Error('사진 폴더를 지정하세요. 예: npm run photos:update -- /path/to/photos');
    const photoDir = resolve(process.argv[3]);
    const files = await readdir(photoDir);
    const photos = new Map();
    for (const name of participants) {
      const matches = files.filter(file => ['.jpg', '.jpeg', '.png', '.webp'].some(ext => file === name + ext));
      if (matches.length > 1) throw new Error(`${name} 사진은 하나만 제공하세요.`);
      if (matches.length === 1) {
        const file = matches[0];
        const bytes = await readFile(join(photoDir, file));
        if (bytes.length > 2 * 1024 * 1024) throw new Error(`${name} 사진은 2MB 이하로 줄여 주세요.`);
        const ext = file.split('.').pop();
        const mime = ext === 'jpg' || ext === 'jpeg' ? 'jpeg' : ext;
        const valid = mime === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : mime === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
        if (!valid) throw new Error(`${name} 사진 형식을 확인하세요.`);
        photos.set(name, `data:image/${mime};base64,${bytes.toString('base64')}`);
      }
    }
    if (!photos.size) throw new Error('이름.jpg, 이름.png 또는 이름.webp 형식의 사진이 없습니다.');
    const deliveries = JSON.parse(await readFile(manifestPath, 'utf8'));
    const updates = [];
    for (const { id, key } of deliveries) {
      const path = join(publicDir, `${id}.json`);
      const payload = await decrypt(JSON.parse(await readFile(path, 'utf8')), key);
      if (photos.has(payload.recipient)) {
        payload.photo = photos.get(payload.recipient);
        updates.push([path, JSON.stringify(await encrypt(payload, key))]);
      }
    }
    for (const [path, contents] of updates) await writeFile(path, contents);
    console.log(`${updates.length}개의 사진을 암호화해 교체했습니다. 매칭과 개인 링크는 유지됩니다.`);
  } else {
    throw new Error('지원 명령: init, links [사이트 주소], photos <사진 폴더>');
  }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
