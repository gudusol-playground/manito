import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { draw, drawEvent, participants, randomParticipants, fixedPair } from '../scripts/draw.mjs';
import { encrypt, decrypt, randomToken, parseFragment } from '../shared/crypto.mjs';

test('1,000 draws assign every participant exactly once with a 17-person cycle and only the designated reciprocal pair', () => {
  for (let attempt = 0; attempt < 1000; attempt++) {
    const assignments = drawEvent();
    const map = new Map(assignments.map(({ sender, recipient }) => [sender, recipient]));
    assert.equal(map.size, 19);
    assert.deepEqual([...new Set(map.values())].sort(), [...participants].sort());
    for (const [sender, recipient] of map) {
      assert.notEqual(sender, recipient);
      if (fixedPair.includes(sender)) assert.equal(recipient, fixedPair.find(name => name !== sender));
      else { assert.ok(randomParticipants.includes(recipient)); assert.notEqual(map.get(recipient), sender); }
    }
    let current = randomParticipants[0];
    const visited = new Set();
    for (let i = 0; i < 17; i++) { visited.add(current); current = map.get(current); }
    assert.equal(visited.size, 17);
    assert.equal(current, participants[0]);
  }
});

test('draw rejects duplicate names and groups too small to satisfy constraints', () => {
  assert.throws(() => draw(['A', 'B']));
  assert.throws(() => draw(['A', 'A', 'B']));
});

test('personal link format rejects missing, truncated, and malformed secrets', () => {
  const id = randomToken(16), key = randomToken();
  assert.deepEqual(parseFragment(`#${id}.${key}`), { id, key });
  for (const value of ['', '#invitation-guide', `#${id}`, `#${id}.${key.slice(1)}`, `#../${id}.${key}`]) assert.throws(() => parseFragment(value));
});

test('authenticated encryption is stable to reopen and rejects wrong keys and altered results', async () => {
  const key = randomToken();
  const payload = { sender: '테스트 보내는 사람', recipient: '테스트 받는 사람', photo: null };
  const envelope = await encrypt(payload, key);
  assert.ok(!JSON.stringify(envelope).includes(payload.recipient));
  assert.deepEqual(await decrypt(envelope, key), payload);
  assert.deepEqual(await decrypt(envelope, key), payload);
  await assert.rejects(() => decrypt(envelope, randomToken()));
  await assert.rejects(() => decrypt({ ...envelope, data: (envelope.data[0] === 'A' ? 'B' : 'A') + envelope.data.slice(1) }, key));
  await assert.rejects(() => decrypt({ ...envelope, v: 2 }, key));
});

test('photo updates keep recipient and personal key, including large photo payloads', async () => {
  const key = randomToken();
  const payload = { sender: '테스트 보내는 사람', recipient: '테스트 받는 사람', photo: `data:image/png;base64,${Buffer.alloc(200000).toString('base64')}` };
  assert.deepEqual(await decrypt(await encrypt(payload, key), key), payload);
  await assert.rejects(async () => decrypt(await encrypt({ ...payload, photo: 'https://external.example/photo.jpg' }, key), key));
});

test('the saved draw has 19 valid fixed personal links; no plaintext results or keys are deployed', async () => {
  const deliveries = JSON.parse(await readFile(new URL('../.private/delivery.json', import.meta.url), 'utf8'));
  const files = await readdir(new URL('../public/results/', import.meta.url));
  assert.equal(deliveries.length, 19);
  assert.equal(files.length, 19);
  assert.equal(new Set(deliveries.map(item => item.id)).size, 19);
  assert.equal(new Set(deliveries.map(item => item.key)).size, 19);
  assert.deepEqual(deliveries.map(item => item.name).sort(), [...participants].sort());
  const assignments = new Map();
  for (const delivery of deliveries) {
    parseFragment(`#${delivery.id}.${delivery.key}`);
    const content = await readFile(new URL(`../public/results/${delivery.id}.json`, import.meta.url), 'utf8');
    assert.ok(!content.includes(delivery.key));
    for (const name of participants) assert.ok(!content.includes(name));
    const envelope = JSON.parse(content);
    const first = await decrypt(envelope, delivery.key);
    const again = await decrypt(envelope, delivery.key);
    // Boolean assertions deliberately avoid printing any real assignment on failure.
    assert.ok(first.sender === delivery.name, 'Sender must match delivery name');
    assert.ok(first.recipient === again.recipient, 'Repeated opens must keep the result');
    assert.ok(Boolean(first.specialExchange) === fixedPair.includes(first.sender), 'Special guidance only for fixed pair');
    assignments.set(first.sender, first.recipient);
  }
  assert.equal(new Set(assignments.values()).size, 19);
  for (const [sender, recipient] of assignments) {
    assert.ok(sender !== recipient, 'No self assignments');
    if (fixedPair.includes(sender)) assert.ok(recipient === fixedPair.find(name => name !== sender), 'Fixed pair must match');
    else { assert.ok(randomParticipants.includes(recipient)); assert.ok(assignments.get(recipient) !== sender, 'No reciprocal pairs in random group'); }
  }
});
