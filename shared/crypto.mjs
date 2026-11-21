export function encode(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decode(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid encoding');
  return Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
}

export function randomToken(length = 32) {
  return encode(crypto.getRandomValues(new Uint8Array(length)));
}

export function parseFragment(fragment) {
  const match = /^#([A-Za-z0-9_-]{22})\.([A-Za-z0-9_-]{43})$/.exec(fragment);
  if (!match || decode(match[1]).length !== 16 || decode(match[2]).length !== 32) throw new Error('Invalid link');
  return { id: match[1], key: match[2] };
}

export async function encrypt(payload, secret) {
  const key = await crypto.subtle.importKey('raw', decode(secret), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(JSON.stringify(payload))));
  // Chunking keeps photo payloads safely below JavaScript's argument limit.
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return { v: 1, iv: encode(iv), data: btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') };
}

export async function decrypt(envelope, secret) {
  if (envelope?.v !== 1 || typeof envelope.iv !== 'string' || typeof envelope.data !== 'string') throw new Error('Invalid result');
  const key = await crypto.subtle.importKey('raw', decode(secret), 'AES-GCM', false, ['decrypt']);
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: decode(envelope.iv) }, key, decode(envelope.data));
  const payload = JSON.parse(new TextDecoder().decode(bytes));
  if (typeof payload.sender !== 'string' || typeof payload.recipient !== 'string' || !payload.sender || !payload.recipient || payload.sender === payload.recipient) throw new Error('Invalid assignment');
  if (payload.photo !== null && (typeof payload.photo !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(payload.photo))) throw new Error('Invalid photo');
  return payload;
}
