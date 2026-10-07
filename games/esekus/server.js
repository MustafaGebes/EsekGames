"use strict";

const crypto = require("node:crypto");

const rooms = new Map();
const clients = new Map();
const COLORS = ["#e84141", "#33c784", "#42a5f5", "#f6b83f", "#bb65e8", "#31c4c8", "#f477bd", "#d3d9e3", "#ff8a42", "#8acb45"];
const MAP_ID = "ahenk-7";
const MAP_NAME = "Yıldız Ahırı: Ahenk-7";
const MIN_PLAYERS = 4;
const MAX_PLAYERS = 10;
const TASKS = Object.freeze([
  { id: "clover_filter", name: "Yonca filtresini arındır", room: "Nebula Serası", x: -8, z: 2, detail: "Üç kozmik tohum kapsülünü doğru haznelere yerleştir." },
  { id: "relay_calibration", name: "Faz rölesini dengele", room: "Ahenk Reaktörü", x: 0, z: 5, detail: "Enerji düğümlerini yanıp sönen sırayla eşleştir." },
  { id: "star_chart", name: "Yıldız rotasını çiz", room: "Yörünge Kubbesi", x: 8, z: 7, detail: "Parlayan yıldızları rotanın doğru sırasıyla bağla." },
  { id: "hay_container", name: "Saman haznesini doldur", room: "Kozmik Ahır", x: 8, z: -3, detail: "Besin kristallerini ağırlık göstergesi yeşile gelene kadar aktar." },
  { id: "magnetic_lock", name: "Manyetik nal kilidini aç", room: "Poyraz Hangarı", x: -8, z: -5, detail: "Karşılıklı kutupları doğru çiftlerle eşleştir." },
  { id: "radar_tune", name: "Radar sinyalini ayarla", room: "Yörünge Kubbesi", x: 8, z: 3, detail: "Sinyal halkasını hedef frekansta durdur." }
]);
const TASK_BY_ID = new Map(TASKS.map((task) => [task.id, task]));
const now = () => Date.now();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const safeName = (value) => String(value || "Gezgin Eşek").replace(/[<>\u0000-\u001f]/g, "").trim().replace(/\s+/g, " ").slice(0, 20) || "Gezgin Eşek";
const send = (client, payload) => {
  if (client && client.socket && client.socket.readyState === 1) client.socket.send(JSON.stringify(payload));
};
const aliveMembers = (room) => [...room.members].map((id) => clients.get(id)).filter((player) => player && player.alive);
const randomId = (prefix = "") => `${prefix}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

function publicRooms() {
  return [...rooms.values()]
    .filter((room) => room.phase === "lobby" || room.phase === "countdown")
    .map((room) => ({ id: room.id, name: room.name, mapId: MAP_ID, mapName: MAP_NAME, currentPlayers: room.members.size, maxPlayers: room.maxPlayers, phase: room.phase, hostName: clients.get(room.hostId)?.name || "Oyuncu", isOpen: room.members.size < room.maxPlayers }))
    .sort((a, b) => b.currentPlayers - a.currentPlayers || a.name.localeCompare(b.name, "tr"));
}
function publishRoomLists() {
  const list = publicRooms();
  for (const client of clients.values()) if (!client.roomId) send(client, { type: "rooms_list", rooms: list, mapId: MAP_ID, mapName: MAP_NAME });
}
function roomSnapshot(room, viewer) {
  const members = [...room.members].map((id) => clients.get(id)).filter(Boolean);
  const reveal = room.phase === "finished";
  return {
    id: room.id, name: room.name, mapId: MAP_ID, mapName: MAP_NAME,
    phase: room.phase, hostId: room.hostId, minPlayers: MIN_PLAYERS, maxPlayers: room.maxPlayers,
    countdownEndsAt: room.countdownEndsAt || 0, meetingEndsAt: room.meetingEndsAt || 0,
    players: members.map((player) => ({
      id: player.id, name: player.name, color: player.color, x: player.x, z: player.z,
      alive: player.alive, isHost: player.id === room.hostId,
      redName: viewer.role === "impostor" && player.role === "impostor" && player.id !== viewer.id,
      role: reveal ? player.role : undefined
    })),
    myRole: viewer.role && room.phase !== "lobby" && room.phase !== "countdown" ? viewer.role : null,
    allies: viewer.role === "impostor" ? members.filter((player) => player.role === "impostor" && player.id !== viewer.id).map(({ id, name }) => ({ id, name })) : [],
    tasks: viewer.role === "crew" ? viewer.tasks.map((taskId) => ({ ...TASK_BY_ID.get(taskId), done: room.completedTasks.has(`${viewer.id}:${taskId}`) })) : [],
    taskDone: room.taskDone, taskTotal: room.taskTotal,
    bodies: room.bodies.map((body) => ({ id: body.id, x: body.x, z: body.z })),
    emergencyUsed: room.emergencyUsed,
    chat: room.chat.slice(-30),
    meeting: room.meeting ? { votes: Object.keys(room.meeting.votes).length, eligible: aliveMembers(room).length } : null
  };
}
function broadcastRoom(room, type = "room_state", extra = {}) {
  for (const id of room.members) {
    const viewer = clients.get(id);
    if (viewer) send(viewer, { type, room: roomSnapshot(room, viewer), ...extra });
  }
}
function appendChat(room, author, text, system = false) {
  const item = { id: randomId("m"), name: system ? "Gemi bilgisayarı" : author.name, text: String(text).slice(0, 180), system, at: now() };
  room.chat.push(item);
  if (room.chat.length > 60) room.chat.splice(0, room.chat.length - 60);
}
function makeRoom(name, host) {
  let id;
  do { id = randomId("A7-"); } while (rooms.has(id));
  return { id, name, mapId: MAP_ID, maxPlayers: MAX_PLAYERS, hostId: host.id, members: new Set(), phase: "lobby", countdownTimer: null, countdownEndsAt: 0, meetingTimer: null, meetingEndsAt: 0, meeting: null, bodies: [], completedTasks: new Set(), taskDone: 0, taskTotal: 0, emergencyUsed: false, chat: [], createdAt: now(), lastActivityAt: now() };
}
function joinRoom(client, room) {
  if (client.roomId) leaveRoom(client, false);
  if (!room || room.phase !== "lobby" || room.members.size >= room.maxPlayers) return send(client, { type: "error", message: "Bu lobi dolu veya oyun başlamış." });
  room.members.add(client.id);
  client.roomId = room.id;
  client.role = null; client.alive = true; client.tasks = []; client.x = 0; client.z = -7;
  room.lastActivityAt = now();
  appendChat(room, client, `${client.name} gemiye katıldı.`, true);
  send(client, { type: "room_joined", roomId: room.id });
  broadcastRoom(room);
  publishRoomLists();
}
function cancelCountdown(room, message) {
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
  room.countdownTimer = null;
  room.countdownEndsAt = 0;
  if (room.phase === "countdown") room.phase = "lobby";
  if (message) appendChat(room, null, message, true);
  broadcastRoom(room);
  publishRoomLists();
}
function countRoles(room) {
  const members = [...room.members].map((id) => clients.get(id)).filter(Boolean);
  const impostorCount = members.length >= 7 ? 2 : 1;
  const shuffled = [...members].sort(() => crypto.randomInt(0, 2) ? 1 : -1);
  shuffled.forEach((player, index) => {
    player.role = index < impostorCount ? "impostor" : "crew";
    player.alive = true;
    player.tasks = player.role === "crew" ? [...TASKS].sort(() => crypto.randomInt(0, 2) ? 1 : -1).slice(0, 3).map((task) => task.id) : [];
    player.lastKillAt = 0;
  });
  room.phase = "playing";
  room.bodies = [];
  room.completedTasks = new Set();
  room.taskDone = 0;
  room.taskTotal = members.reduce((sum, player) => sum + player.tasks.length, 0);
  room.emergencyUsed = false;
  room.meeting = null;
  for (const player of members) send(player, { type: "role_reveal", role: player.role, allies: player.role === "impostor" ? members.filter((other) => other.role === "impostor" && other.id !== player.id).map(({ id, name }) => ({ id, name })) : [] });
  appendChat(room, null, "Görev başladı. Mürettebat görevleri tamamlasın; gizli takım kimliğini saklasın.", true);
  broadcastRoom(room);
}
function startCountdown(room, requester) {
  if (requester.id !== room.hostId) return send(requester, { type: "error", message: "Oyunu yalnızca lobi sahibi başlatabilir." });
  if (room.phase !== "lobby") return;
  if (room.members.size < MIN_PLAYERS) return send(requester, { type: "error", message: `Başlamak için en az ${MIN_PLAYERS} oyuncu gerekli.` });
  room.phase = "countdown";
  room.countdownEndsAt = now() + 5000;
  appendChat(room, null, "Başlangıç 5 saniye içinde. Biri ayrılırsa sayaç iptal edilir.", true);
  broadcastRoom(room);
  room.countdownTimer = setTimeout(() => {
    room.countdownTimer = null;
    if (room.phase !== "countdown" || room.members.size < MIN_PLAYERS) return cancelCountdown(room, "Oyuncu sayısı azaldı; başlangıç iptal edildi.");
    countRoles(room);
  }, 5000);
}
function finishGame(room, winner, reason) {
  if (room.phase === "finished") return;
  if (room.countdownTimer) clearTimeout(room.countdownTimer);
  if (room.meetingTimer) clearTimeout(room.meetingTimer);
  room.phase = "finished";
  appendChat(room, null, reason, true);
  broadcastRoom(room, "game_over", { winner, reason });
}
function checkWin(room) {
  if (room.phase !== "playing" && room.phase !== "meeting") return;
  const alive = aliveMembers(room);
  const impostors = alive.filter((player) => player.role === "impostor").length;
  const crew = alive.filter((player) => player.role === "crew").length;
  if (!impostors) return finishGame(room, "crew", "Gizli takım gemiden çıkarıldı.");
  if (room.taskTotal > 0 && room.taskDone >= room.taskTotal) return finishGame(room, "crew", "Mürettebat bütün görevleri tamamladı.");
  if (impostors >= crew) return finishGame(room, "impostor", "Gizli takım sayısal üstünlüğü ele geçirdi.");
}
function removeMember(room, client, reason = "ayrıldı") {
  if (!room.members.has(client.id)) return;
  room.members.delete(client.id);
  client.roomId = null;
  if ((room.phase === "playing" || room.phase === "meeting") && client.role === "crew") {
    const unfinished = client.tasks.filter((taskId) => !room.completedTasks.has(`${client.id}:${taskId}`)).length;
    room.taskTotal = Math.max(room.taskDone, room.taskTotal - unfinished);
  }
  if (room.phase === "countdown") cancelCountdown(room, "Bir oyuncu ayrıldı; geri sayım iptal edildi.");
  else {
    appendChat(room, client, `${client.name} ${reason}.`, true);
    broadcastRoom(room);
  }
  if (room.phase === "playing" || room.phase === "meeting") checkWin(room);
  if (!room.members.size) {
    if (room.countdownTimer) clearTimeout(room.countdownTimer);
    if (room.meetingTimer) clearTimeout(room.meetingTimer);
    rooms.delete(room.id);
  } else if (room.hostId === client.id) {
    room.hostId = [...room.members][0];
    appendChat(room, null, `${clients.get(room.hostId)?.name || "Bir oyuncu"} lobi sahibi oldu.`, true);
    broadcastRoom(room);
  }
  publishRoomLists();
}
function leaveRoom(client, notify = true) {
  const room = rooms.get(client.roomId);
  if (room) removeMember(room, client, "lobiden ayrıldı");
  client.roomId = null;
  if (notify) send(client, { type: "room_left" });
}
function beginMeeting(room, caller, bodyId = null) {
  if (room.phase !== "playing" || !caller.alive) return;
  if (bodyId) {
    const body = room.bodies.find((item) => item.id === bodyId);
    if (!body || distance(caller, body) > 2.7) return send(caller, { type: "error", message: "Ceset yakında değil." });
  } else if (room.emergencyUsed || distance(caller, { x: 0, z: -7 }) > 2.6) return send(caller, { type: "error", message: "Acil toplantı köprüde kullanılabilir ve maç başına bir kezdir." });
  if (!bodyId) room.emergencyUsed = true;
  room.phase = "meeting";
  room.meeting = { votes: Object.create(null) };
  room.meetingEndsAt = now() + 25000;
  room.meetingTimer = setTimeout(() => resolveMeeting(room), 25000);
  appendChat(room, null, bodyId ? `${caller.name} bir ceset buldu; toplantı başladı.` : `${caller.name} acil toplantı çağırdı.`, true);
  broadcastRoom(room, "meeting_started", { caller: caller.name, bodyReported: !!bodyId });
}
function resolveMeeting(room) {
  if (!room.meeting || room.phase !== "meeting") return;
  if (room.meetingTimer) clearTimeout(room.meetingTimer);
  const tally = new Map();
  for (const target of Object.values(room.meeting.votes)) if (target && target !== "skip") tally.set(target, (tally.get(target) || 0) + 1);
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const tied = ranked.length > 1 && ranked[0][1] === ranked[1][1];
  const ejected = ranked.length && !tied ? clients.get(ranked[0][0]) : null;
  if (ejected && room.members.has(ejected.id)) ejected.alive = false;
  room.bodies = [];
  appendChat(room, null, ejected ? `${ejected.name} gemiden çıkarıldı.` : "Oylar eşitlendi; kimse çıkarılmadı.", true);
  room.phase = "playing";
  room.meeting = null;
  room.meetingEndsAt = 0;
  broadcastRoom(room, "meeting_result", { ejected: ejected ? { id: ejected.id, name: ejected.name, role: ejected.role } : null });
  checkWin(room);
}
function handleMessage(client, data) {
  const room = rooms.get(client.roomId);
  if (data.type !== "register" && !client.registered) return send(client, { type: "error", code: "identity_required", message: "Önce EsekGames kimliğin doğrulanmalı." });
  switch (data.type) {
    case "register": {
      if (client.registered) {
        send(client, { type: "registered", id: client.id, name: client.name, isAccount: client.isAccount, identityType: client.identityType, mapId: MAP_ID, mapName: MAP_NAME, minPlayers: MIN_PLAYERS });
        return;
      }
      const auth = client.authServices;
      if (!auth || typeof auth.resolveAccountToken !== "function" || typeof auth.allocateGuestName !== "function") {
        send(client, { type: "error", code: "identity_unavailable", message: "EsekGames kimlik servisine şu anda ulaşılamıyor." });
        return;
      }
      const token = String(data.token || "").trim().slice(0, 128);
      const account = auth.resolveAccountToken(token);
      const accountName = account?.username ? safeName(account.username) : "";
      const localNameInUse = (name) => [...clients.values()].some((other) => other.id !== client.id && other.registered && other.name.toLocaleLowerCase() === name.toLocaleLowerCase());
      if (accountName) {
        if (localNameInUse(accountName) || auth.isSharedNameUsed?.(accountName)) {
          send(client, { type: "error", code: "identity_in_use", message: "Bu EsekGames hesabı başka bir çevrimiçi oturumda kullanılıyor. Diğer oyundan çıkıp tekrar dene." });
          return;
        }
        client.name = accountName;
        client.isAccount = true;
        client.identityType = "account";
      } else {
        client.name = auth.allocateGuestName((candidate) => localNameInUse(candidate));
        client.isAccount = false;
        client.identityType = "guest";
      }
      client.registered = true;
      send(client, { type: "registered", id: client.id, name: client.name, isAccount: client.isAccount, identityType: client.identityType, mapId: MAP_ID, mapName: MAP_NAME, minPlayers: MIN_PLAYERS });
      send(client, { type: "rooms_list", rooms: publicRooms(), mapId: MAP_ID, mapName: MAP_NAME });
      return;
    }
    case "rooms_request": send(client, { type: "rooms_list", rooms: publicRooms(), mapId: MAP_ID, mapName: MAP_NAME }); return;
    case "create_room": {
      if (client.roomId) leaveRoom(client, false);
      const name = safeName(data.name).slice(0, 24);
      if (name.length < 2 || name === "Gezgin Eşek") return send(client, { type: "error", message: "Lobi adı en az 2 karakter olmalı." });
      const created = makeRoom(name, client);
      rooms.set(created.id, created);
      joinRoom(client, created);
      appendChat(created, null, `${client.name} yeni bir lobi oluşturdu.`, true);
      broadcastRoom(created);
      return;
    }
    case "join_room": {
      if (client.roomId) return send(client, { type: "error", message: "Önce bulunduğun lobiden ayrıl." });
      joinRoom(client, rooms.get(String(data.roomId || "")));
      return;
    }
    case "leave_room": leaveRoom(client); return;
    case "start_game": if (room) startCountdown(room, client); return;
    case "replay": {
      if (!room || room.phase !== "finished" || client.id !== room.hostId) return;
      for (const id of room.members) { const player = clients.get(id); if (player) { player.role = null; player.alive = true; player.tasks = []; player.x = 0; player.z = -7; } }
      room.phase = "lobby"; room.completedTasks.clear(); room.bodies = []; room.taskDone = 0; room.taskTotal = 0; room.chat = [];
      broadcastRoom(room); publishRoomLists();
      return;
    }
    case "chat": {
      if (!room || !["lobby", "meeting"].includes(room.phase)) return;
      if (now() - client.lastChatAt < 650) return;
      const text = String(data.text || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, 180);
      if (!text) return;
      client.lastChatAt = now(); appendChat(room, client, text); broadcastRoom(room); return;
    }
    case "move": {
      if (!room || room.phase !== "playing" || !client.alive) return;
      const time = now(); const elapsed = clamp((time - client.lastMoveAt) / 1000, 0.02, 0.25); client.lastMoveAt = time;
      const wanted = { x: clamp(Number(data.x) || 0, -13, 13), z: clamp(Number(data.z) || 0, -9, 9) };
      const maxMove = elapsed * 7 + 0.18; const delta = distance(client, wanted);
      if (delta > maxMove && delta > 0) { const ratio = maxMove / delta; wanted.x = client.x + (wanted.x - client.x) * ratio; wanted.z = client.z + (wanted.z - client.z) * ratio; }
      client.x = wanted.x; client.z = wanted.z; client.lastActivityAt = time; return;
    }
    case "complete_task": {
      if (!room || room.phase !== "playing" || !client.alive || client.role !== "crew") return;
      const task = TASK_BY_ID.get(String(data.taskId || ""));
      if (!task || !client.tasks.includes(task.id) || room.completedTasks.has(`${client.id}:${task.id}`) || distance(client, task) > 3) return send(client, { type: "error", message: "Görev panelinin yanına yaklaş." });
      room.completedTasks.add(`${client.id}:${task.id}`); room.taskDone += 1; room.lastActivityAt = now(); appendChat(room, null, `${client.name} bir görevi tamamladı.`, true);
      broadcastRoom(room, "task_progress"); checkWin(room); return;
    }
    case "kill": {
      if (!room || room.phase !== "playing" || !client.alive || client.role !== "impostor") return;
      const target = clients.get(String(data.targetId || ""));
      if (!target || target.roomId !== room.id || !target.alive || target.role !== "crew" || target.id === client.id || distance(client, target) > 1.8 || now() - client.lastKillAt < 18000) return;
      client.lastKillAt = now(); target.alive = false; room.bodies.push({ id: randomId("B"), x: target.x, z: target.z, victimId: target.id });
      appendChat(room, null, "Bir oyuncu yere yığıldı.", true); broadcastRoom(room, "player_down", { victimId: target.id }); checkWin(room); return;
    }
    case "report_body": if (room) beginMeeting(room, client, String(data.bodyId || "")); return;
    case "emergency_meeting": if (room) beginMeeting(room, client); return;
    case "vote": {
      if (!room || room.phase !== "meeting" || !client.alive || !room.meeting) return;
      const choice = String(data.targetId || "skip");
      if (choice !== "skip" && (!room.members.has(choice) || !clients.get(choice)?.alive)) return;
      room.meeting.votes[client.id] = choice; broadcastRoom(room);
      if (aliveMembers(room).every((player) => Object.hasOwn(room.meeting?.votes || {}, player.id))) resolveMeeting(room);
      return;
    }
    default: return;
  }
}

function attachEsekusSocket(socket, authServices = null) {
  const client = { id: randomId("P"), socket, name: null, registered: false, isAccount: false, identityType: null, authServices, color: COLORS[clients.size % COLORS.length], roomId: null, role: null, alive: true, tasks: [], x: 0, z: -7, lastMoveAt: now(), lastChatAt: 0, lastKillAt: 0 };
  clients.set(client.id, client);
  socket.on("message", (raw) => {
    if (raw.length > 2048) return socket.close(1009, "Mesaj boyutu sınırı aşıldı");
    let data;
    try { data = JSON.parse(raw.toString()); } catch (_) { return; }
    if (!data || typeof data !== "object" || Array.isArray(data) || typeof data.type !== "string") return;
    handleMessage(client, data);
  });
  socket.on("close", () => {
    const room = rooms.get(client.roomId);
    if (room) removeMember(room, client, "bağlantısı kesildi");
    clients.delete(client.id);
    publishRoomLists();
  });
  socket.on("error", (error) => console.error("[ESEKUS WS]", error.message));
  send(client, { type: "connected", id: client.id, mapId: MAP_ID, mapName: MAP_NAME, minPlayers: MIN_PLAYERS });
}

setInterval(() => {
  for (const room of rooms.values()) {
    if (room.phase === "playing" || room.phase === "meeting") broadcastRoom(room);
    if (!room.members.size && now() - room.lastActivityAt > 300000) rooms.delete(room.id);
  }
}, 120);

module.exports = { attachEsekusSocket };
