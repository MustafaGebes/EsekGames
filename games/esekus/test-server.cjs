const assert = require('node:assert/strict');
const WebSocket = require('ws');
const endpoint = process.env.ESEKUS_WS || 'ws://127.0.0.1:3011/games/esekus/ws';
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
function connect(name) {
  const ws = new WebSocket(endpoint);
  const messages = [];
  ws.on('message', (raw) => { try { messages.push(JSON.parse(raw.toString())); } catch (_) {} });
  return { ws, messages, name, send(type, body = {}) { ws.send(JSON.stringify({ type, ...body })); }, latestRoom() { return [...messages].reverse().find((item) => item.room)?.room; } };
}
async function open(client) {
  await new Promise((resolve, reject) => { client.ws.once('open', resolve); client.ws.once('error', reject); });
  client.send('register', { name: client.name });
  await delay(80);
}
async function until(predicate, message, timeout = 7000) {
  const start = Date.now();
  while (Date.now() - start < timeout) { if (predicate()) return; await delay(50); }
  throw new Error(`Timeout: ${message}`);
}
(async () => {
  const clients = Array.from({ length: 7 }, (_, index) => connect(`Test Eşek ${index + 1}`));
  try {
    await Promise.all(clients.map(open));
    clients[0].send('create_room', { name: 'Ahenk Test Lobisi' });
    await until(() => clients[0].latestRoom()?.players?.length === 1, 'create room');
    const roomId = clients[0].latestRoom().id;
    for (const client of clients.slice(1)) {
      client.send('join_room', { roomId });
      await until(() => client.latestRoom()?.players?.length >= 2, `${client.name} joins`);
    }
    clients[0].send('chat', { text: 'Ağ sohbeti çalışıyor' });
    await until(() => clients[1].latestRoom()?.chat?.some((item) => item.text === 'Ağ sohbeti çalışıyor'), 'lobby chat');

    clients[0].send('start_game');
    await until(() => clients[0].latestRoom()?.phase === 'countdown', 'countdown start');
    await delay(900);
    clients[6].ws.close();
    clients.pop();
    await until(() => clients[0].latestRoom()?.phase === 'lobby' && clients[0].latestRoom()?.chat?.some((item) => item.text.includes('geri sayım iptal edildi')), 'countdown cancellation');

    const replacement = connect('Test Eşek 7'); clients.push(replacement); await open(replacement); replacement.send('join_room', { roomId });
    await until(() => replacement.latestRoom()?.players?.length === 7, 'replacement joins');
    clients[0].send('start_game');
    await until(() => clients[0].messages.some((item) => item.type === 'role_reveal'), 'match role reveal', 7500);
    await until(() => clients[0].latestRoom()?.phase === 'playing', 'playing phase');

    const roles = clients.map((client) => client.messages.find((item) => item.type === 'role_reveal')?.role);
    assert.equal(roles.filter((role) => role === 'impostor').length, 2, '7 players should have two impostors');
    assert.equal(roles.filter((role) => role === 'crew').length, 5);
    const impostorIndexes = roles.map((role, index) => role === 'impostor' ? index : -1).filter((index) => index >= 0);
    for (const index of impostorIndexes) {
      const allyId = clients[index].latestRoom().players.find((player) => player.id !== clients[index].latestRoom().players.find((candidate) => candidate.name === clients[index].name)?.id && player.redName)?.id;
      assert.ok(allyId, 'impostor should see their teammate name in red');
      const ally = clients.find((client) => client.latestRoom()?.players.some((player) => player.id === allyId));
      const target = clients[index].latestRoom().players.find((player) => player.id === allyId);
      clients[index].send('kill', { targetId: allyId }); await delay(250);
      assert.ok(ally.latestRoom().players.find((player) => player.id === allyId)?.alive, 'an impostor cannot kill a teammate');
      assert.equal(target.role, undefined, 'hidden role should not leak in ordinary player snapshot');
    }
    const crewIndex = roles.findIndex((role) => role === 'crew');
    const crewClient = clients[crewIndex]; const initial = crewClient.latestRoom();
    const task = initial.tasks?.[0]; assert.ok(task, 'crew receives task assignment');
    assert.equal(task.done, false);
    const impostor = clients[impostorIndexes[0]]; const crewPlayer = impostor.latestRoom().players.find((player) => player.name === crewClient.name);
    assert.equal(crewPlayer.redName, false, 'crew sees impostor names in the normal color and vice versa');
    impostor.send('kill', { targetId: crewPlayer.id });
    await until(() => crewClient.latestRoom()?.players.find((player) => player.id === crewPlayer.id)?.alive === false, 'valid elimination');
    const bodyId = crewClient.latestRoom().bodies[0]?.id; assert.ok(bodyId, 'a body is created after elimination');
    const survivingCrew = clients.find((client, index) => roles[index] === 'crew' && client.latestRoom()?.players.find((player) => player.id === client.latestRoom()?.players.find((p) => p.name === client.name)?.id)?.alive);
    survivingCrew.send('report_body', { bodyId });
    await until(() => survivingCrew.latestRoom()?.phase === 'meeting', 'report opens meeting');
    survivingCrew.send('chat', { text: 'Toplantı sohbeti çalışıyor' });
    await until(() => clients[0].latestRoom()?.chat?.some((item) => item.text === 'Toplantı sohbeti çalışıyor'), 'meeting chat');
    for (const client of clients) {
      const own = client.latestRoom()?.players.find((player) => player.name === client.name);
      if (own?.alive) client.send('vote', { targetId: 'skip' });
    }
    await until(() => clients[0].latestRoom()?.phase === 'playing', 'meeting resolves');

    const taskCrew = survivingCrew; const liveRoom = taskCrew.latestRoom(); const livePlayer = liveRoom.players.find((player) => player.name === taskCrew.name); const taskToDo = liveRoom.tasks.find((item) => !item.done); assert.ok(taskToDo, 'crew has an unfinished task');
    let px = livePlayer.x, pz = livePlayer.z;
    for (let step = 0; step < 60 && Math.hypot(px - taskToDo.x, pz - taskToDo.z) > 2; step += 1) {
      const dx = taskToDo.x - px, dz = taskToDo.z - pz, length = Math.hypot(dx, dz) || 1;
      px += dx / length * Math.min(.5, length); pz += dz / length * Math.min(.5, length); taskCrew.send('move', { x: px, z: pz }); await delay(105);
      const actual = taskCrew.latestRoom().players.find((player) => player.id === livePlayer.id); px = actual.x; pz = actual.z;
    }
    const beforeTasks = taskCrew.latestRoom().taskDone; taskCrew.send('complete_task', { taskId: taskToDo.id });
    await until(() => taskCrew.latestRoom()?.taskDone > beforeTasks, 'server validates task completion');

    const leaverIndex = roles.findIndex((role, index) => role === 'crew' && clients[index] !== taskCrew && clients[index].latestRoom()?.players.find((player) => player.name === clients[index].name)?.alive);
    const leaver = clients[leaverIndex]; const leaverState = leaver.latestRoom(); const leaverPlayer = leaverState.players.find((player) => player.name === leaver.name);
    const pendingForLeaver = leaverState.tasks.filter((item) => !item.done).length; const oldTaskTotal = leaverState.taskTotal;
    assert.ok(pendingForLeaver > 0, 'departing crew has pending work'); leaver.ws.close();
    await until(() => taskCrew.latestRoom()?.players.length === 6, 'mid-match disconnect');
    assert.equal(taskCrew.latestRoom().taskTotal, oldTaskTotal - pendingForLeaver, 'unfinished tasks of a disconnecting crew are removed from the win counter');

    console.log(JSON.stringify({ ok: true, roomId, connected: clients.length, lobbyChat: 'ok', countdownCancellation: 'ok', assignedRoles: roles, allyNamesRedOnlyForImpostors: 'ok', teammateEliminationBlocked: 'ok', crewEliminationAndReport: 'ok', meetingChatAndVote: 'ok', assignedTask: taskToDo.id, serverTaskCompletion: 'ok', disconnectTaskAccounting: 'ok', disconnectedPlayer: leaver.name, remainingTasks: taskCrew.latestRoom().taskTotal }));
  } finally {
    for (const client of clients) { try { if (client.ws.readyState === WebSocket.OPEN) { client.send('leave_room'); client.ws.close(); } } catch (_) {} }
    await delay(120);
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
