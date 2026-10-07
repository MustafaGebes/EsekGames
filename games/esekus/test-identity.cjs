const assert = require('node:assert/strict');
const WebSocket = require('ws');
const { attachEsekusSocket } = require('./server.js');
const wss = new WebSocket.WebSocketServer({ port: 0 });
const externalNames = new Set();
wss.on('connection', (socket) => attachEsekusSocket(socket, {
  resolveAccountToken: (token) => token === 'valid-account-token' ? { username: 'AccountMember' } : null,
  isSharedNameUsed: (name) => externalNames.has(name),
  allocateGuestName: (extraNameIsUsed) => {
    let number = 0;
    let name;
    do { name = `Guest-${String(number++).padStart(3, '0')}`; } while (externalNames.has(name) || extraNameIsUsed(name));
    return name;
  }
}));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function makeClient() {
  const ws = new WebSocket(`ws://127.0.0.1:${wss.address().port}`);
  const messages = [];
  ws.on('message', (raw) => { try { messages.push(JSON.parse(raw.toString())); } catch {} });
  return { ws, messages, send(type, body = {}) { ws.send(JSON.stringify({ type, ...body })); } };
}
async function waitFor(predicate, label, timeout = 3000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (predicate()) return; await delay(20); }
  throw new Error(`Timeout: ${label}`);
}
async function connectAndRegister(token = '', spoofedName = 'SpoofedName') {
  const client = makeClient();
  await new Promise((resolve, reject) => { client.ws.once('open', resolve); client.ws.once('error', reject); });
  client.send('register', { token, name: spoofedName });
  await waitFor(() => client.messages.some((item) => item.type === 'registered' || item.type === 'error'), 'registered or rejected');
  return client;
}
async function close(client) {
  if (client.ws.readyState !== WebSocket.OPEN) return;
  await new Promise((resolve) => { client.ws.once('close', resolve); client.ws.close(); });
}
(async () => {
  const all = [];
  try {
    if (!wss.address()) await new Promise((resolve) => wss.once('listening', resolve));
    const account = await connectAndRegister('valid-account-token'); all.push(account);
    const accountIdentity = account.messages.find((item) => item.type === 'registered');
    assert.equal(accountIdentity.name, 'AccountMember', 'valid EsekGames token resolves to the account username');
    assert.equal(accountIdentity.identityType, 'account');
    assert.equal(accountIdentity.isAccount, true);

    const duplicateAccount = await connectAndRegister('valid-account-token'); all.push(duplicateAccount);
    assert.equal(duplicateAccount.messages.find((item) => item.type === 'error')?.code, 'identity_in_use', 'the same account cannot occupy two concurrent game sessions');
    assert.equal(duplicateAccount.messages.some((item) => item.type === 'registered'), false);
    await close(duplicateAccount); all.pop();
    await close(account); all.pop();

    const guests = [];
    for (let index = 0; index < 12; index += 1) {
      const guest = await connectAndRegister('', `UntrustedName-${index}`);
      guests.push(guest); all.push(guest);
      const identity = guest.messages.find((item) => item.type === 'registered');
      assert.equal(identity.name, `Guest-${String(index).padStart(3, '0')}`, 'guest ID is server-assigned in first-free ascending order');
      assert.equal(identity.identityType, 'guest');
      assert.equal(identity.isAccount, false);
    }
    assert.equal(guests[11].messages.find((item) => item.type === 'registered').name, 'Guest-011', 'guest numbering has no artificial Guest-010 cap');

    await close(guests[0]); all.splice(all.indexOf(guests[0]), 1);
    const firstFree = await connectAndRegister('', 'AnotherSpoofedName'); all.push(firstFree);
    assert.equal(firstFree.messages.find((item) => item.type === 'registered').name, 'Guest-000', 'the lowest freed guest number is reused');

    console.log(JSON.stringify({ ok: true, accountTokenResolution: 'ok', duplicateAccountProtection: 'ok', sequentialGuestIds: 'Guest-000..Guest-011', unboundedGuestNumbering: 'ok', lowestFreeNumberReuse: 'ok', clientSuppliedNamesIgnored: 'ok' }));
  } finally {
    for (const client of all) await close(client).catch(() => {});
    await new Promise((resolve) => wss.close(resolve));
    setTimeout(() => process.exit(0), 30);
  }
})().catch((error) => { console.error(error); process.exit(1); });
