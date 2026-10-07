import * as THREE from 'three';
import { ShipScene, taskDistance } from './scene.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const screens = ['home-view', 'online-view', 'lobby-view', 'settings-view', 'controls-view', 'game-view'];
const palette = ['#ea4848', '#38c984', '#4ba5ff', '#f3b744', '#bb65e8'];
function preferredControlMode() { const saved = localStorage.getItem('eu-control-mode'); return saved === 'pc' || saved === 'mobile' ? saved : (matchMedia('(pointer: coarse)').matches || innerWidth < 680 ? 'mobile' : 'pc'); }
const PRACTICE_TASKS = Object.freeze([
  { id: 'clover_filter', name: 'Yonca filtresini arındır', room: 'Nebula Serası', x: -8, z: 2, detail: 'Üç kozmik tohum kapsülünü doğru haznelere yerleştir.' },
  { id: 'relay_calibration', name: 'Faz rölesini dengele', room: 'Ahenk Reaktörü', x: 0, z: 5, detail: 'Enerji düğümlerini yanıp sönen sırayla eşleştir.' },
  { id: 'star_chart', name: 'Yıldız rotasını çiz', room: 'Yörünge Kubbesi', x: 8, z: 7, detail: 'Parlayan yıldızları rotanın doğru sırasıyla bağla.' },
  { id: 'hay_container', name: 'Saman haznesini doldur', room: 'Kozmik Ahır', x: 8, z: -3, detail: 'Besin kristallerini ağırlık göstergesi yeşile gelene kadar aktar.' },
  { id: 'magnetic_lock', name: 'Manyetik nal kilidini aç', room: 'Poyraz Hangarı', x: -8, z: -5, detail: 'Karşılıklı kutupları doğru çiftlerle eşleştir.' },
  { id: 'radar_tune', name: 'Radar sinyalini ayarla', room: 'Yörünge Kubbesi', x: 8, z: 3, detail: 'Sinyal halkasını hedef frekansta durdur.' }
]);
const PRACTICE_DUMMIES = [
  { id: 'practice-dummy-1', name: 'Eğitim Kuklası 01', color: '#e84141', x: -8, z: 0 },
  { id: 'practice-dummy-2', name: 'Eğitim Kuklası 02', color: '#42a5f5', x: 8, z: 1 },
  { id: 'practice-dummy-3', name: 'Eğitim Kuklası 03', color: '#f6b83f', x: -8, z: 6 },
  { id: 'practice-dummy-4', name: 'Eğitim Kuklası 04', color: '#bb65e8', x: 8, z: 7 }
];
const state = { socket: null, connected: false, registered: false, wantsOnline: false, id: null, room: null, rooms: [], name: '', isAccount: false, color: localStorage.getItem('eu-mobile-color') || '#ea4848', controlMode: preferredControlMode(), practice: false, joy: { x: 0, y: 0 }, view: 'home-view', position: { x: 0, z: -7 }, keys: new Set(), meetingSignature: '', lobbyChatSignature: '', meetingChatSignature: '', taskBusy: false, lastMoveSend: 0, lastTick: performance.now(), toastTimer: null, lastPhase: null };
const canvas = $('space-canvas');
let ship;
try { ship = new ShipScene(canvas); } catch (error) { console.error('Eşek Us 3D sahnesi başlatılamadı:', error); $('app').classList.add('scene-fallback'); notify('3D sahne açılamadı; yedek görünüm kullanılıyor.', true); }

function showView(id) {
  state.view = id;
  for (const screen of screens) $(screen)?.classList.toggle('is-hidden', screen !== id);
  if (ship) ship.setMode(id !== 'game-view');
  $('mobile-pad')?.classList.toggle('is-hidden', id !== 'game-view' || state.controlMode !== 'mobile');
  $('practice-console')?.classList.toggle('is-hidden', id !== 'game-view' || !state.practice);
}
function notify(message, error = false) {
  const toast = $('toast'); if (!toast) return;
  toast.textContent = message; toast.classList.remove('is-hidden', 'error'); if (error) toast.classList.add('error');
  clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => toast.classList.add('is-hidden'), 3200);
}
function send(type, details = {}) {
  if (!state.socket || state.socket.readyState !== WebSocket.OPEN) { notify('Sunucu bağlantısı henüz hazır değil.', true); return false; }
  state.socket.send(JSON.stringify({ type, ...details })); return true;
}
function setConnection(isOnline) {
  state.connected = isOnline;
  const box = document.querySelector('.status'); box?.classList.toggle('online', isOnline); box?.classList.toggle('offline', !isOnline);
  $('connection-label').textContent = isOnline ? 'Ahenk-7 ağı çevrimiçi' : (state.wantsOnline ? 'Sunucu bağlantısı kesildi' : 'Çevrimiçi olmak için Oyna');
}
function authToken() {
  try { const account = JSON.parse(localStorage.getItem('esekAuth') || 'null'); if (typeof account?.token === 'string') return account.token; } catch {}
  return localStorage.getItem('esek_auth_token') || localStorage.getItem('authToken') || '';
}
function connect() {
  state.wantsOnline = true;
  if (state.socket?.readyState === WebSocket.OPEN) { if (state.registered) send('rooms_request'); return; }
  if (state.socket?.readyState === WebSocket.CONNECTING) return;
  const scheme = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${scheme}//${location.host}/games/esekus/ws`); state.socket = socket;
  socket.addEventListener('open', () => { setConnection(true); send('register', { token: authToken() }); });
  socket.addEventListener('message', (event) => { let data; try { data = JSON.parse(event.data); } catch { return; } handleServer(data); });
  socket.addEventListener('close', () => { setConnection(false); if (state.socket === socket) { state.socket = null; state.registered = false; if (state.room) { state.room = null; state.lastPhase = null; if (state.wantsOnline) showView('online-view'); notify('Sunucu bağlantısı kesildi; yeniden bağlanıyorum.', true); } if (state.wantsOnline) setTimeout(() => { if (state.wantsOnline) connect(); }, 2200); } });
  socket.addEventListener('error', () => setConnection(false));
}
function stopOnline() {
  state.wantsOnline = false;
  if (state.room && state.socket?.readyState === WebSocket.OPEN) send('leave_room');
  state.room = null; state.registered = false; state.name = '';
  const socket = state.socket; state.socket = null; if (socket) socket.close();
  setConnection(false);
}
function handleServer(data) {
  switch (data.type) {
    case 'connected': state.id = data.id; break;
    case 'registered': { state.id = data.id; state.registered = true; state.name = data.name || ''; state.isAccount = !!data.isAccount; $('player-name').value = state.name; $('settings-name').value = state.name; $('identity-type').textContent = state.isAccount ? 'ESEKGAMES HESABI' : 'MİSAFİR'; $('identity-type').classList.toggle('identity-account', state.isAccount); $('identity-type').classList.toggle('identity-guest', !state.isAccount); $('identity-note').textContent = state.isAccount ? 'EsekGames hesabın doğrulandı; ortak hesap kullanıcı adın kullanılıyor.' : `Hesap oturumu bulunmadı; sunucu sana ilk boş ${state.name} kimliğini verdi.`; setConnection(true); renderRooms(); break; }
    case 'rooms_list': state.rooms = data.rooms || []; renderRooms(); break;
    case 'room_joined': break;
    case 'room_state':
    case 'task_progress':
    case 'meeting_started':
    case 'meeting_result':
    case 'player_down':
      if (data.room) updateRoom(data.room, data); break;
    case 'role_reveal': showRole(data); break;
    case 'game_over': if (data.room) updateRoom(data.room, data); showGameOver(data); break;
    case 'room_left': state.room = null; state.lastPhase = null; if (state.wantsOnline) { showView('online-view'); send('rooms_request'); } else showView('home-view'); break;
    case 'error': if (data.code === 'identity_in_use') { state.registered = false; $('identity-type').textContent = 'OTURUM ÇAKIŞMASI'; $('identity-note').textContent = data.message || 'Bu hesap başka bir oturumda açık.'; } notify(data.message || 'İşlem gerçekleştirilemedi.', true); break;
    default: break;
  }
}
function updateRoom(room, eventData = {}) {
  const previous = state.lastPhase; state.room = room;
  const me = room.players?.find((player) => player.id === state.id);
  if (me) { state.position.x = me.x; state.position.z = me.z; }
  ship?.updateRoom(room, state.id);
  if (room.phase === 'countdown') {
    showView('lobby-view'); renderLobby(room); renderCountdown(room);
  } else if (room.phase === 'lobby') {
    showView('lobby-view'); renderLobby(room); $('lobby-countdown').textContent = '';
  } else if (room.phase === 'playing') {
    showView('game-view'); $('meeting-overlay').classList.add('is-hidden'); $('game-over').classList.add('is-hidden'); renderGameHud(room); $('game-phase-label').textContent = state.practice ? 'AHENK-7 / SERBEST DENEME' : 'AHENK-7 / GÖREV AKTİF'; $('objective-card').classList.toggle('is-hidden', room.myRole === 'impostor');
    if (previous !== 'playing' && !eventData.keepRole) $('nearby-prompt').textContent = room.myRole === 'impostor' ? 'Sakın kimliğini belli etme.' : 'Yakındaki görev paneline E ile yaklaş.';
  } else if (room.phase === 'meeting') {
    showView('game-view'); renderGameHud(room); renderMeeting(room, eventData); $('meeting-overlay').classList.remove('is-hidden'); $('game-phase-label').textContent = 'TOPLANTI / OYLAMA';
  } else if (room.phase === 'finished') {
    showView('game-view'); renderGameHud(room); $('game-over').classList.remove('is-hidden'); $('meeting-overlay').classList.add('is-hidden');
  }
  state.lastPhase = room.phase;
  if (eventData.type === 'meeting_result' && eventData.ejected) notify(`${eventData.ejected.name} gemiden çıkarıldı. Rol: ${eventData.ejected.role === 'impostor' ? 'Gizli takım' : 'Mürettebat'}`);
  if (eventData.type === 'task_progress') notify('Görev tamamlandı; ekip ilerlemesi güncellendi.');
  if (room.phase === 'countdown') renderCountdown(room);
}
function renderRooms() {
  const list = $('room-list'); $('room-count').textContent = `${state.rooms.length} açık lobi · ${state.connected ? 'canlı liste' : 'bağlantı yok'}`;
  if (!state.rooms.length) { list.innerHTML = '<div class="empty-state"><span>✦</span><b>Şimdilik boş</b><small>İlk lobi seninki olabilir. Tek harita: Yıldız Ahırı: Ahenk-7.</small></div>'; return; }
  list.replaceChildren(...state.rooms.map((room) => {
    const card = document.createElement('article'); card.className = 'room-card';
    const symbol = document.createElement('div'); symbol.className = 'room-symbol'; symbol.textContent = '✦';
    const info = document.createElement('div'); info.className = 'room-info';
    const title = document.createElement('b'); title.textContent = room.name;
    const details = document.createElement('small'); details.textContent = `${room.hostName} · ${room.mapName} · ${room.currentPlayers}/${room.maxPlayers}`;
    info.append(title, details); const join = document.createElement('button'); join.className = 'room-join'; join.textContent = room.isOpen && room.phase === 'lobby' ? 'KATIL' : 'DOLU'; join.disabled = !state.registered || !room.isOpen || room.phase !== 'lobby'; join.addEventListener('click', () => send('join_room', { roomId: room.id }));
    card.append(symbol, info, join); return card;
  }));
}
function renderLobby(room) {
  $('lobby-title').textContent = room.name; $('lobby-code').textContent = room.id; $('lobby-map').textContent = room.mapName || 'Yıldız Ahırı: Ahenk-7';
  $('player-count').textContent = `${room.players.length} / ${room.maxPlayers} oyuncu`;
  const me = room.players.find((player) => player.id === state.id); const isHost = room.hostId === state.id;
  $('host-mark').classList.toggle('is-hidden', !isHost);
  const playerList = $('lobby-players'); playerList.replaceChildren(...room.players.map((player) => {
    const item = document.createElement('div'); item.className = 'player-chip'; const dot = document.createElement('i'); dot.className = 'player-dot'; dot.style.color = player.color; dot.style.background = player.color;
    const name = document.createElement('span'); name.textContent = player.name; const badge = document.createElement('small'); badge.textContent = player.isHost ? 'HOST' : 'HAZIR'; item.append(dot, name, badge); return item;
  }));
  $('minimum-note').textContent = room.players.length < room.minPlayers ? `Başlamak için ${room.minPlayers - room.players.length} oyuncu daha gerekli.` : 'Ekip yeterli. Başla düğmesi lobi sahibinde etkin.';
  $('start-game').disabled = !isHost || room.players.length < room.minPlayers || room.phase !== 'lobby';
  $('start-game').innerHTML = room.phase === 'countdown' ? 'Başlangıç sayıyor <b>5</b>' : 'Başla <b>5</b>';
  renderLobbyChat(room.chat || []);
  if (me && ship) ship.setLocalPosition(me.x, me.z);
}
function renderCountdown(room) {
  const seconds = Math.max(0, Math.ceil((room.countdownEndsAt - Date.now()) / 1000));
  $('lobby-countdown').textContent = seconds ? `Gemi ${seconds} saniye içinde kalkıyor...` : 'Oyuncular bekleniyor...';
  $('start-game').innerHTML = `Başlangıç sayıyor <b>${seconds || 5}</b>`;
}
function renderLobbyChat(messages) {
  const signature = messages.map((item) => item.id).join('|'); if (signature === state.lobbyChatSignature) return; state.lobbyChatSignature = signature;
  const log = $('lobby-chat'); log.replaceChildren(...messages.map((item) => { const line = document.createElement('div'); line.className = item.system ? 'chat-line system' : 'chat-line'; if (item.system) line.textContent = item.text; else { const name = document.createElement('b'); name.textContent = `${item.name}: `; line.append(name, document.createTextNode(item.text)); } return line; })); log.scrollTop = log.scrollHeight;
}
function renderGameHud(room) {
  const total = room.taskTotal || 0, done = room.taskDone || 0, percent = total ? Math.round(done / total * 100) : 0;
  $('task-meter-fill').style.width = `${percent}%`; $('task-meter-text').textContent = `${percent}%`;
  const tasks = (room.tasks || []).filter((task) => task.assigned !== false); const taskList = $('task-list');
  if (room.myRole === 'impostor') taskList.innerHTML = '<div class="task-row"><i>◉</i><span>Görev taklidi yap. Mürettebatı gözetle ve doğru anı bekle.</span></div>';
  else if (!tasks.length) taskList.innerHTML = '<div class="task-row"><i>✦</i><span>Rol atanıyor...</span></div>';
  else taskList.replaceChildren(...tasks.map((task) => { const row = document.createElement('div'); row.className = `task-row${task.done ? ' done' : ''}`; const icon = document.createElement('i'); icon.textContent = task.done ? '✓' : '◇'; const text = document.createElement('span'); text.textContent = `${task.name} · ${task.room}`; row.append(icon, text); return row; }));
  const alive = room.players.filter((player) => player.alive).length; $('alive-status').textContent = `${alive} / ${room.players.length} mürettebat hayatta`;
  renderNearby(room);
}
function renderNearby(room) {
  const me = room.players.find((player) => player.id === state.id); if (!me || !me.alive) { $('nearby-prompt').textContent = 'Hayalet olarak gemide dolaş ve görevlerine devam et.'; return; }
  const mobile = state.controlMode === 'mobile'; const movement = mobile ? 'joystick' : 'WASD / oklar';
  if (room.myRole === 'impostor') {
    const target = room.players.filter((player) => player.id !== state.id && player.alive && !player.redName).sort((a, b) => taskDistance(me.x, me.z, a) - taskDistance(me.x, me.z, b))[0];
    $('nearby-prompt').innerHTML = target && taskDistance(me.x, me.z, target) < 2 ? `Hedef yakında: <b>${escapeHtml(target.name)}</b> · ${mobile ? '!' : 'Q'}` : `${movement} ile dolaş · ${mobile ? '!' : 'Q'} ile uygun anı bekle`; return;
  }
  const task = nearestTask(room, me); $('nearby-prompt').innerHTML = task ? `Yakın görev: <b>${escapeHtml(task.name)}</b> · ${mobile ? 'renkli düğme' : 'E'}` : `Bir sonraki görev işaretine yaklaş · ${movement}`;
}
function escapeHtml(text) { const node = document.createElement('span'); node.textContent = text; return node.innerHTML; }
function nearestTask(room, me) {
  return (room.tasks || []).filter((task) => !task.done && task.assigned !== false).map((task) => ({ task, distance: taskDistance(me.x, me.z, task) })).filter((item) => item.distance < 2.55).sort((a, b) => a.distance - b.distance)[0]?.task || null;
}
function showRole(data) {
  showView('game-view'); $('role-overlay').classList.remove('is-hidden'); const card = document.querySelector('.role-card'); const impostor = data.role === 'impostor'; card.classList.toggle('impostor', impostor);
  $('role-title').textContent = impostor ? 'ŞŞŞT! GİZLİ TAKIM' : 'ŞŞŞT! MÜRETTEBAT'; $('role-icon').textContent = '🫏';
  $('role-description').textContent = impostor ? 'Kimliğini sakla. İmplant arkadaşların adını kırmızı görür; ekibinizi birbirinize karşı hedefleyemezsiniz.' : 'Görevlerini tamamla, gemideki hareketleri gözle ve toplantıda dikkatini paylaş.';
  $('role-allies').textContent = impostor && data.allies?.length ? `Takım arkadaşların: ${data.allies.map((person) => person.name).join(', ')}` : impostor ? 'Bu maçta gizli takımın tek üyesi sensin.' : '';
  hushSound();
}
function hushSound() {
  try { const Audio = window.AudioContext || window.webkitAudioContext; if (!Audio) return; const context = new Audio(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.type = 'sawtooth'; oscillator.frequency.setValueAtTime(500, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(160, context.currentTime + .28); gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.07, context.currentTime + .04); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .33); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .34); setTimeout(() => context.close(), 500); } catch (_) {}
}
function showGameOver(data) {
  $('game-over').classList.remove('is-hidden'); $('meeting-overlay').classList.add('is-hidden'); $('winner-title').textContent = state.practice ? 'DENEME TAMAMLANDI' : data.winner === 'impostor' ? 'GİZLİ TAKIM KAZANDI' : 'MÜRETTEBAT KAZANDI'; $('winner-title').style.color = data.winner === 'impostor' && !state.practice ? '#ff786d' : '#a2e4b8'; $('winner-reason').textContent = data.reason || ''; $('replay-button').textContent = state.practice ? 'Denemeyi yeniden başlat' : 'Yeniden oyna'; $('return-servers').textContent = state.practice ? 'Ana menüye dön' : 'Sunuculara dön';
  const players = state.room?.players || []; $('final-roles').replaceChildren(...players.map((player) => { const item = document.createElement('div'); item.className = 'final-role'; item.textContent = player.name; const role = document.createElement('b'); role.textContent = player.role === 'impostor' ? 'Gizli takım' : 'Mürettebat'; item.appendChild(role); return item; }));
}
function renderMeeting(room, eventData = {}) {
  $('meeting-title').textContent = eventData.caller ? `${eventData.caller} toplantı çağırdı` : 'Herkes köprüye!';
  $('meeting-description').textContent = 'Kimin nerede olduğunu konuşun; sonra oyunuzu verin.';
  const signature = `${room.phase}:${room.meeting?.votes || 0}:${room.players.map((p) => `${p.id}:${p.alive}`).join(',')}`;
  if (signature !== state.meetingSignature) {
    state.meetingSignature = signature; const list = $('vote-list'); const me = room.players.find((player) => player.id === state.id);
    const alive = room.players.filter((player) => player.alive && player.id !== state.id);
    list.replaceChildren(...alive.map((player) => { const row = document.createElement('div'); row.className = 'vote-choice'; const name = document.createElement('span'); name.textContent = player.name; const button = document.createElement('button'); button.textContent = 'OY VER'; button.disabled = !me?.alive; button.addEventListener('click', () => send('vote', { targetId: player.id })); row.append(name, button); return row; }));
    const skip = document.createElement('div'); skip.className = 'vote-choice'; const skipName = document.createElement('span'); skipName.textContent = 'Bu tur pas geç'; const skipButton = document.createElement('button'); skipButton.textContent = 'PAS'; skipButton.disabled = !me?.alive; skipButton.addEventListener('click', () => send('vote', { targetId: 'skip' })); skip.append(skipName, skipButton); list.appendChild(skip);
  }
  const seconds = Math.max(0, Math.ceil((room.meetingEndsAt - Date.now()) / 1000)); $('meeting-timer').textContent = `${room.meeting?.votes || 0} / ${room.meeting?.eligible || 0} oy · ${seconds} sn`;
  mountMeetingChat(room.chat || []);
}
function mountMeetingChat(messages) {
  const card = document.querySelector('.meeting-card'); let box = card.querySelector('.meeting-chat');
  if (!box) { box = document.createElement('div'); box.className = 'meeting-chat'; box.innerHTML = '<div class="meeting-chat-log"></div><form class="meeting-chat-form"><input maxlength="180" placeholder="Toplantı sohbeti..." /><button>↑</button></form>'; card.appendChild(box); box.querySelector('form').addEventListener('submit', (event) => { event.preventDefault(); const input = box.querySelector('input'); if (input.value.trim()) send('chat', { text: input.value.trim() }); input.value = ''; }); }
  const signature = messages.map((item) => item.id).join('|'); if (signature === state.meetingChatSignature) return; state.meetingChatSignature = signature;
  const log = box.querySelector('.meeting-chat-log'); log.replaceChildren(...messages.slice(-8).map((item) => { const line = document.createElement('div'); line.className = item.system ? 'chat-line system' : 'chat-line'; if (item.system) line.textContent = item.text; else { const name = document.createElement('b'); name.textContent = `${item.name}: `; line.append(name, document.createTextNode(item.text)); } return line; })); log.scrollTop = log.scrollHeight;
}
function openTask(task) {
  if (state.taskBusy || !state.room) return; state.taskBusy = true;
  const modal = document.createElement('div'); modal.className = 'task-overlay'; const content = document.createElement('div'); content.className = 'task-modal';
  const title = document.createElement('h2'); title.textContent = task.name; const detail = document.createElement('p'); detail.textContent = task.detail; const close = document.createElement('button'); close.className = 'task-close'; close.textContent = '×'; close.addEventListener('click', () => modal.remove());
  const sequence = task.id === 'relay_calibration' ? [2, 0, 3, 1] : task.id === 'clover_filter' ? [1, 2, 0] : task.id === 'star_chart' ? [0, 2, 3, 1] : task.id === 'magnetic_lock' ? [3, 1, 2, 0] : task.id === 'radar_tune' ? [2, 1, 3] : [1, 0, 2];
  const progress = document.createElement('div'); progress.className = 'task-progress'; progress.textContent = `AYARLAMA 0 / ${sequence.length}`;
  const nodes = document.createElement('div'); nodes.className = 'task-nodes'; const nodeButtons = sequence.map((_, index) => { const button = document.createElement('button'); button.textContent = task.id === 'clover_filter' ? ['🍀', '✦', '◈', '❋'][index] : task.id === 'hay_container' ? ['1', '2', '3', '4'][index] : ['A', 'B', 'C', 'D'][index]; button.setAttribute('aria-label', `Düğüm ${index + 1}`); button.addEventListener('click', () => { if (index === sequence[step]) { button.classList.add('active'); step += 1; progress.textContent = `AYARLAMA ${step} / ${sequence.length}`; if (step === sequence.length) complete(); } else { step = 0; progress.textContent = `SIRA KARIŞTI · 0 / ${sequence.length}`; nodeButtons.forEach((node) => node.classList.remove('active')); } }); return button; });
  let step = 0; const complete = () => { if (state.practice) completePracticeTask(task.id); else send('complete_task', { taskId: task.id }); modal.remove(); state.taskBusy = false; };
  const closeTask = () => { modal.remove(); state.taskBusy = false; };
  close.addEventListener('click', closeTask); content.append(close, document.createElement('div'), title, detail, progress, nodes); nodeButtons.forEach((button) => nodes.appendChild(button));
  if (task.id === 'hay_container') { progress.textContent = 'Besin kristallerini sırayla aktar'; }
  const footer = document.createElement('small'); footer.textContent = task.id === 'radar_tune' ? 'Sinyal sabitlenene kadar doğru frekansı yakala.' : 'İşaretli panelleri sırayla etkinleştir.'; content.appendChild(footer); modal.appendChild(content); document.body.appendChild(modal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeTask(); });
  const originalClose = closeTask;
  const observer = new MutationObserver(() => { if (!document.body.contains(modal)) { state.taskBusy = false; observer.disconnect(); } }); observer.observe(document.body, { childList: true });
}
function nearestBody(room, me) { return (room.bodies || []).map((body) => ({ body, distance: taskDistance(me.x, me.z, body) })).sort((a, b) => a.distance - b.distance)[0]; }
function interact() {
  const room = state.room; if (!room || room.phase !== 'playing') return;
  const me = room.players.find((player) => player.id === state.id); if (!me) return;
  if (room.myRole === 'crew' && me.alive) { const task = nearestTask(room, me); if (task) openTask(task); else notify('Görev paneline biraz daha yaklaş.'); }
  else if (room.myRole === 'impostor' && me.alive) killNearest();
}
function killNearest() {
  const room = state.room; if (!room || room.myRole !== 'impostor') return;
  const me = room.players.find((player) => player.id === state.id); const target = room.players.filter((player) => player.id !== state.id && player.alive && !player.redName).map((player) => ({ player, d: taskDistance(me, player) })).sort((a, b) => a.d - b.d)[0];
  if (!target || target.d > 1.95) return notify('Hedef görüş alanında ve yakınında olmalı.', true);
  if (state.practice) { target.player.alive = false; room.bodies.push({ id: `practice-body-${target.player.id}`, playerId: target.player.id, x: target.player.x, z: target.player.z }); ship?.updateRoom(room, state.id); renderGameHud(room); notify(`${target.player.name} eğitim kuklası sıfırlandı.`); return; }
  send('kill', { targetId: target.player.id });
}
function reportOrMeeting() {
  const room = state.room; if (!room || room.phase !== 'playing') return; const me = room.players.find((player) => player.id === state.id); if (!me?.alive) return;
  const body = nearestBody(room, me);
  if (body && body.distance < 2.7) {
    if (!state.practice) return send('report_body', { bodyId: body.body.id });
    room.bodies = room.bodies.filter((item) => item.id !== body.body.id); const dummy = room.players.find((player) => player.id === body.body.playerId);
    if (dummy) { dummy.alive = true; dummy.x = dummy.homeX; dummy.z = dummy.homeZ; }
    ship?.updateRoom(room, state.id); renderGameHud(room); notify('Eğitim kuklası yeniden ayağa kalktı.'); return;
  }
  if (taskDistance(me, { x: 0, z: -7 }) < 2.6 && !room.emergencyUsed) {
    if (!state.practice) return send('emergency_meeting');
    room.emergencyUsed = true; notify(`Deneme toplantısı: eğitim ekibi ${Math.random() < 0.5 ? 'seni' : 'bir kuklayı'} rastgele seçti.`); return;
  }
  notify('Rapor için cesede yaklaş veya köprüde acil toplantı çağır.');
}
function makePracticeRoom(role = 'crew') {
  const me = { id: 'practice-player', name: 'Sen', role, color: '#55d69b', alive: true, redName: false, isHost: true, x: 0, z: -7, homeX: 0, homeZ: -7 };
  const dummies = PRACTICE_DUMMIES.map((dummy) => ({ ...dummy, role: 'crew', alive: true, redName: false, isHost: false, homeX: dummy.x, homeZ: dummy.z }));
  const tasks = PRACTICE_TASKS.map((task) => ({ ...task, done: false, assigned: true }));
  return { id: 'practice-room', name: 'Serbest Deneme', mapId: 'ahenk-7', mapName: 'Yıldız Ahırı: Ahenk-7', phase: 'playing', hostId: me.id, myRole: role, players: [me, ...dummies], tasks, taskTotal: tasks.length, taskDone: 0, minPlayers: 1, maxPlayers: 5, bodies: [], chat: [], emergencyUsed: false, meeting: null };
}
function startPractice() {
  if (state.socket && state.socket.readyState !== WebSocket.CLOSED) stopOnline();
  state.practice = true; state.id = 'practice-player'; state.position = { x: 0, z: -7 }; state.lastPhase = null; state.keys.clear(); state.joy = { x: 0, y: 0 };
  state.room = makePracticeRoom(); $('game-over').classList.add('is-hidden'); $('meeting-overlay').classList.add('is-hidden'); $('role-overlay').classList.add('is-hidden'); $('practice-overlay').classList.add('is-hidden');
  updateRoom(state.room, { type: 'practice_start' }); notify('Serbest deneme başladı. Konsoldan rolünü ve görevlerini seçebilirsin.');
}
function stopPractice() {
  if (!state.practice) return;
  state.practice = false; state.room = null; state.id = null; state.lastPhase = null; state.position = { x: 0, z: -7 }; state.keys.clear(); state.joy = { x: 0, y: 0 }; state.taskBusy = false;
  document.querySelector('.task-overlay')?.remove(); $('practice-overlay').classList.add('is-hidden'); $('game-over').classList.add('is-hidden'); $('meeting-overlay').classList.add('is-hidden'); $('role-overlay').classList.add('is-hidden');
  ship?.updateRoom({ players: [], tasks: [], bodies: [] }, null); showView('home-view'); notify('Ana menüye dönüldü.');
}
function refreshPracticeCounts(room) {
  const assigned = room.tasks.filter((task) => task.assigned !== false); room.taskTotal = assigned.length; room.taskDone = assigned.filter((task) => task.done).length;
}
function completePracticeTask(taskId) {
  const room = state.room; if (!state.practice || !room || room.myRole !== 'crew') return;
  const task = room.tasks.find((item) => item.id === taskId); if (!task || task.done) return;
  task.assigned = true; task.done = true; refreshPracticeCounts(room); updateRoom(room, { type: 'practice_task', keepRole: true });
  notify('Deneme görevi tamamlandı.');
  if (room.taskTotal > 0 && room.taskDone >= room.taskTotal) { room.phase = 'finished'; updateRoom(room, { type: 'practice_finished', keepRole: true }); $('practice-overlay').classList.add('is-hidden'); showGameOver({ winner: 'crew', reason: 'Ahenk-7 deneme görevlerini tamamladın.' }); }
}
function switchPracticeRole(role) {
  if (!state.practice || !['crew', 'impostor'].includes(role)) return;
  const room = state.room; const me = room.players.find((player) => player.id === state.id); room.myRole = role; if (me) me.role = role; room.phase = 'playing';
  $('game-over').classList.add('is-hidden'); updateRoom(room, { type: 'practice_role', keepRole: true });
  notify(role === 'crew' ? 'Mürettebat rolü seçildi.' : 'Gizli takım rolü seçildi. Kuklalar üzerinde dene.'); openPracticeConsole();
}
function togglePracticeTask(taskId) {
  if (!state.practice || !state.room) return;
  const task = state.room.tasks.find((item) => item.id === taskId); if (!task) return;
  task.assigned = task.assigned === false; if (task.assigned === false) task.done = false; refreshPracticeCounts(state.room);
  if (state.room.phase === 'finished') { state.room.phase = 'playing'; $('game-over').classList.add('is-hidden'); }
  updateRoom(state.room, { type: 'practice_assignment', keepRole: true }); openPracticeConsole();
}
function resetPractice() {
  if (!state.practice) return;
  const role = state.room?.myRole || 'crew'; state.position = { x: 0, z: -7 }; state.lastPhase = null; state.keys.clear(); state.room = makePracticeRoom(role);
  $('game-over').classList.add('is-hidden'); $('meeting-overlay').classList.add('is-hidden'); $('practice-overlay').classList.add('is-hidden');
  updateRoom(state.room, { type: 'practice_reset', keepRole: true }); notify('Deneme gemisi ve görevleri sıfırlandı.');
}
function openPracticeConsole() {
  if (!state.practice || !state.room) return;
  const room = state.room; const overlay = $('practice-overlay'); overlay.replaceChildren();
  const modal = document.createElement('section'); modal.className = 'practice-modal';
  const close = document.createElement('button'); close.className = 'task-close'; close.type = 'button'; close.textContent = '×'; close.setAttribute('aria-label', 'Konsolu kapat'); close.addEventListener('click', () => overlay.classList.add('is-hidden'));
  const title = document.createElement('h2'); title.textContent = 'Ahenk-7 deneme konsolu';
  const description = document.createElement('p'); description.textContent = 'Çevrimdışı alıştırma. Rolünü değiştir, görevleri ata veya listeden tamamla.';
  const roleChoices = document.createElement('div'); roleChoices.className = 'practice-role-choices';
  for (const [role, label] of [['crew', 'Mürettebat'], ['impostor', 'Gizli takım']]) { const button = document.createElement('button'); button.type = 'button'; button.className = `practice-role-button${room.myRole === role ? ' selected' : ''}`; button.textContent = label; button.setAttribute('aria-pressed', String(room.myRole === role)); button.addEventListener('click', () => switchPracticeRole(role)); roleChoices.appendChild(button); }
  const taskHeading = document.createElement('p'); taskHeading.className = 'eyebrow'; taskHeading.textContent = 'GÖREVLER · ' + room.taskDone + ' / ' + room.taskTotal;
  const taskList = document.createElement('div'); taskList.className = 'practice-task-list';
  for (const task of room.tasks) {
    const row = document.createElement('div'); row.className = 'practice-task-row'; const copy = document.createElement('div'); copy.className = 'practice-task-copy';
    const name = document.createElement('b'); name.textContent = task.name; const area = document.createElement('small'); area.textContent = task.room; copy.append(name, area);
    const assign = document.createElement('button'); assign.type = 'button'; assign.className = 'practice-task-button'; assign.textContent = task.assigned === false ? 'Göreve ata' : 'Görevde'; assign.setAttribute('aria-pressed', String(task.assigned !== false)); assign.addEventListener('click', () => togglePracticeTask(task.id));
    const done = document.createElement('button'); done.type = 'button'; done.className = 'practice-task-button'; done.textContent = task.done ? 'Tamamlandı' : 'Tamamla'; done.disabled = task.done || task.assigned === false || room.myRole !== 'crew'; done.addEventListener('click', () => { completePracticeTask(task.id); if (state.room?.phase !== 'finished') openPracticeConsole(); });
    row.append(copy, assign, done); taskList.appendChild(row);
  }
  const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'practice-reset-button'; reset.textContent = 'Denemeyi sıfırla'; reset.addEventListener('click', () => { resetPractice(); openPracticeConsole(); });
  modal.append(close, title, description, roleChoices, taskHeading, taskList, reset); overlay.appendChild(modal); overlay.classList.remove('is-hidden');
  overlay.onclick = (event) => { if (event.target === overlay) overlay.classList.add('is-hidden'); };
}
function setControlMode(mode, announce = true) {
  if (!['pc', 'mobile'].includes(mode)) return;
  state.controlMode = mode; localStorage.setItem('eu-control-mode', mode);
  for (const [id, selected] of [['pc-controls-button', mode === 'pc'], ['mobile-controls-button', mode === 'mobile']]) { const button = $(id); button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', String(selected)); }
  $('mobile-pad').classList.toggle('is-hidden', state.view !== 'game-view' || mode !== 'mobile');
  if (announce) notify(mode === 'pc' ? 'PC kontrolleri seçildi.' : 'Mobil kontrolleri seçildi.');
}
function applySettings() {
  localStorage.setItem('eu-mobile-color', state.color); document.documentElement.style.setProperty('--mobile-action', state.color); $('settings-name').value = state.name || '';
  notify('Ayarlar kaydedildi.');
}
function toggleMobileControls() { $('mobile-pad').classList.toggle('is-hidden'); }

$('play-button').addEventListener('click', () => { showView('online-view'); connect(); });
$('practice-button').addEventListener('click', startPractice);
$('settings-button').addEventListener('click', () => { $('settings-name').value = state.name || ''; document.querySelectorAll('#button-colors button').forEach((button) => button.classList.toggle('selected', button.dataset.color === state.color)); showView('settings-view'); });
$('settings-save').addEventListener('click', applySettings);
$('button-colors').addEventListener('click', (event) => { const button = event.target.closest('button[data-color]'); if (!button) return; state.color = button.dataset.color; document.documentElement.style.setProperty('--mobile-action', state.color); document.querySelectorAll('#button-colors button').forEach((item) => item.classList.toggle('selected', item === button)); });
$('pc-controls-button').addEventListener('click', () => setControlMode('pc'));
$('mobile-controls-button').addEventListener('click', () => setControlMode('mobile'));
$('exit-button').addEventListener('click', () => { if (state.room) send('leave_room'); location.href = '/'; });
document.querySelectorAll('[data-home]').forEach((button) => button.addEventListener('click', () => { if (state.view === 'online-view' && !state.room) stopOnline(); showView('home-view'); }));
$('refresh-rooms').addEventListener('click', () => send('rooms_request'));
$('create-room').addEventListener('click', () => { if (!state.registered) return notify('Önce EsekGames kimliğinin doğrulanmasını bekle.', true); const name = prompt('Lobi adını yaz:'); if (name === null) return; send('create_room', { name }); });
$('start-game').addEventListener('click', () => send('start_game'));
$('leave-lobby').addEventListener('click', () => send('leave_room'));
$('chat-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('chat-input'); const text = input.value.trim(); if (text) send('chat', { text }); input.value = ''; input.focus(); });
$('leave-game').addEventListener('click', () => { if (state.practice) return stopPractice(); if (confirm('Maçtan ayrılıp sunucu listesine dönmek istiyor musun?')) send('leave_room'); });
$('role-continue').addEventListener('click', () => $('role-overlay').classList.add('is-hidden'));
$('replay-button').addEventListener('click', () => state.practice ? resetPractice() : send('replay')); $('return-servers').addEventListener('click', () => state.practice ? stopPractice() : send('leave_room'));
$('practice-console').addEventListener('click', openPracticeConsole);
$('mobile-interact').addEventListener('click', interact); $('mobile-danger').addEventListener('click', () => { if (state.room?.myRole === 'impostor') killNearest(); else reportOrMeeting(); });

const joystick = $('joystick'); let joyPointer = null;
joystick.addEventListener('pointerdown', (event) => { joyPointer = event.pointerId; joystick.setPointerCapture(joyPointer); updateJoy(event); });
joystick.addEventListener('pointermove', (event) => { if (event.pointerId === joyPointer) updateJoy(event); });
function updateJoy(event) { const rect = joystick.getBoundingClientRect(); const dx = event.clientX - rect.left - rect.width / 2; const dy = event.clientY - rect.top - rect.height / 2; const max = rect.width * .31; const len = Math.hypot(dx, dy) || 1; const x = dx * Math.min(1, max / len), y = dy * Math.min(1, max / len); joystick.firstElementChild.style.transform = `translate(${x}px,${y}px)`; state.joy = { x: x / max, y: y / max }; }
function endJoy(event) { if (event.pointerId !== joyPointer) return; joyPointer = null; state.joy = { x: 0, y: 0 }; joystick.firstElementChild.style.transform = ''; }
joystick.addEventListener('pointerup', endJoy); joystick.addEventListener('pointercancel', endJoy); joystick.addEventListener('lostpointercapture', () => { state.joy = { x: 0, y: 0 }; joystick.firstElementChild.style.transform = ''; });
window.addEventListener('keydown', (event) => { if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return; if (event.key === 'Escape') { if (state.practice) { if (state.taskBusy) document.querySelector('.task-overlay')?.remove(); else if (!$('practice-overlay').classList.contains('is-hidden')) $('practice-overlay').classList.add('is-hidden'); else stopPractice(); return; } if (!state.room) { if (state.view === 'online-view') stopOnline(); showView('home-view'); } else if (state.taskBusy) document.querySelector('.task-overlay')?.remove(); return; } const key = event.key.toLowerCase(); if (['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key)) { event.preventDefault(); state.keys.add(key); } if (key === 'e') interact(); if (key === 'q') state.room?.myRole === 'impostor' ? killNearest() : reportOrMeeting(); });
window.addEventListener('keyup', (event) => state.keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => state.keys.clear());
window.addEventListener('storage', (event) => {
  if (!['esekAuth', 'esek_auth_token', 'authToken'].includes(event.key) || !state.wantsOnline || state.room) return;
  state.registered = false; state.name = ''; $('identity-type').textContent = 'OTURUM YENİLENİYOR'; $('identity-note').textContent = 'EsekGames hesap bilgisi değişti; yeniden doğrulanıyor.';
  const socket = state.socket; state.socket = null; if (socket) socket.close(); setTimeout(() => { if (state.wantsOnline && !state.room) connect(); }, 100);
});
function tick(now) {
  requestAnimationFrame(tick); const dt = Math.min(.05, (now - state.lastTick) / 1000); state.lastTick = now;
  if (state.room?.phase === 'playing') {
    const x = (state.keys.has('d') || state.keys.has('arrowright') ? 1 : 0) - (state.keys.has('a') || state.keys.has('arrowleft') ? 1 : 0) + (state.joy?.x || 0);
    const z = (state.keys.has('s') || state.keys.has('arrowdown') ? 1 : 0) - (state.keys.has('w') || state.keys.has('arrowup') ? 1 : 0) + (state.joy?.y || 0);
    const length = Math.hypot(x, z) || 1; if (length > .05) { state.position.x = Math.max(-13, Math.min(13, state.position.x + (x / length) * dt * 6.4)); state.position.z = Math.max(-9, Math.min(9, state.position.z + (z / length) * dt * 6.4)); ship?.setLocalPosition(state.position.x, state.position.z); }
    if (state.practice) { const me = state.room.players.find((player) => player.id === state.id); if (me) { me.x = state.position.x; me.z = state.position.z; } }
    else if (now - state.lastMoveSend > 85 && (length > .05 || now - state.lastMoveSend > 450)) { send('move', { x: state.position.x, z: state.position.z }); state.lastMoveSend = now; }
  }
  if (state.room?.phase === 'countdown') renderCountdown(state.room);
  if (state.room?.phase === 'meeting') $('meeting-timer').textContent = `${state.room.meeting?.votes || 0} / ${state.room.meeting?.eligible || 0} oy · ${Math.max(0, Math.ceil((state.room.meetingEndsAt - Date.now()) / 1000))} sn`;
  if (state.view === 'game-view' && state.room?.phase === 'playing') renderNearby(state.room);
}

const loading = $('loading'); const progress = $('load-progress'); let loadValue = 4;
const loadTimer = setInterval(() => { loadValue = Math.min(94, loadValue + 9 + Math.random() * 13); progress.style.width = `${loadValue}%`; if (loadValue >= 94) clearInterval(loadTimer); }, 110);
window.addEventListener('load', () => setTimeout(() => { progress.style.width = '100%'; loading.style.opacity = '0'; setTimeout(() => { loading.remove(); $('app').classList.remove('is-hidden'); requestAnimationFrame(() => ship?.resize()); }, 650); }, 650));
$('player-name').value = ''; $('settings-name').value = ''; $('identity-type').textContent = 'OYNA İLE BAĞLAN'; document.documentElement.style.setProperty('--mobile-action', state.color); $('connection-label').textContent = 'Çevrimiçi olmak için Oyna'; setControlMode(state.controlMode, false);
requestAnimationFrame(tick); showView('home-view');
