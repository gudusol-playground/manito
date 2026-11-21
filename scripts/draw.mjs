import { randomInt } from 'node:crypto';

export const participants = ['구본혁', '김서하', '김소현', '김정윤', '박영규', '서재운', '이서현', '이성훈', '이세훈', '이태검', '장휘정', '정기민', '최수빈', '최원영', '최민준', '유태승'];

export function draw(names) {
  if (names.length < 3 || new Set(names).size !== names.length) throw new Error('At least three unique participants required');
  const shuffled = [...names];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((sender, i) => ({ sender, recipient: shuffled[(i + 1) % shuffled.length], photo: null }));
}
