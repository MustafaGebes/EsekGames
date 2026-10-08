const DATA = window.EsekCityData;
const byId = (id) => document.getElementById(id);

export function createCityGameplay({ state, player, citySimulation, enterableWorld, send, showToast, toggleNearbyDoor, passNearbyDoor, getNearbyHideSpot = () => null, onPlayerHit = () => {} }) {
  if (!DATA) throw new Error('EsekCityData yüklenmedi.');

  const style = document.createElement('style');
  style.textContent = `
    #cityHud{position:fixed;right:18px;top:16px;z-index:6;display:none;min-width:178px;padding:11px 13px;border:1px solid #ffffff35;border-radius:14px;background:rgba(15,20,18,.88);box-shadow:0 10px 32px #0007;backdrop-filter:blur(12px);font-size:12px}
    #cityHud.show{display:grid;gap:6px}.city-wallet{display:flex;justify-content:space-between;align-items:center;color:#e6c47e;font-weight:900}.city-wallet strong{font-size:17px;color:#fff1d0}.city-vitals{display:flex;justify-content:space-between;align-items:center;gap:9px}.city-hearts{display:flex;gap:2px;font-size:14px;line-height:1}.city-heart{color:#673735}.city-heart.full{color:#ff7469;text-shadow:0 0 8px #ef433f77}.city-stars{color:#635d53;letter-spacing:1px}.city-stars .wanted{color:#ffc64f;text-shadow:0 0 8px #ffb83277}.city-police-timer{color:#ffc881;font-size:10px;font-weight:850;letter-spacing:.4px}
    .city-overlay{position:fixed;inset:0;z-index:14;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(4,7,5,.78);backdrop-filter:blur(10px)}.city-overlay.open{display:flex}.city-panel{width:min(720px,100%);max-height:min(88dvh,780px);overflow:auto;padding:clamp(20px,4vw,32px);border:1px solid #f1d08e48;border-radius:22px;background:linear-gradient(150deg,#20251fef,#111512f5);box-shadow:0 30px 100px #000b;color:#f3ead7}.city-panel.narrow{width:min(510px,100%)}.city-panel h2{margin:0;color:#f2d08c;font-size:clamp(24px,4vw,34px);letter-spacing:-.04em}.city-subtitle{margin:8px 0 20px;color:#bdb9ac;line-height:1.5;font-size:13px}.city-panel-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.city-close{width:38px;height:38px;border:1px solid #ffffff2c;border-radius:11px;background:#ffffff0b;color:#f4ead7;font-size:20px}.city-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(230px,100%),1fr));gap:10px}.city-item{display:grid;grid-template-columns:42px 1fr;gap:3px 10px;padding:13px;border:1px solid #ffffff1b;border-radius:14px;background:#ffffff08}.city-item-icon{grid-row:span 3;display:grid;place-items:center;width:40px;height:40px;border-radius:11px;background:#e3b85b15;font-size:22px}.city-item-title{font-size:13px;font-weight:900}.city-item-description{min-height:30px;color:#aaa99d;font-size:11px;line-height:1.4}.city-item-footer{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:5px}.city-price{color:#f1d08c;font-size:12px;font-weight:900}.city-action{min-height:34px;padding:0 12px;border:1px solid #e8bd6b77;border-radius:9px;background:#dca94920;color:#f7d99b;font-size:11px;font-weight:900}.city-action:disabled{opacity:.42;cursor:not-allowed}.city-empty{padding:22px;text-align:center;border:1px dashed #ffffff30;border-radius:13px;color:#aaa99d;line-height:1.55}.city-bag-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px}.city-bag-slot{min-height:102px;padding:12px;border:1px solid #ffffff20;border-radius:13px;background:#ffffff08}.city-bag-slot strong{display:block;margin:4px 0;font-size:12px}.city-bag-slot small{display:block;color:#aaa99d;font-size:11px}.city-bag-actions{display:flex;gap:6px;margin-top:9px}.city-bag-actions .city-action{flex:1;padding:0 7px}.city-talk-line{padding:18px;border-left:3px solid #e7b95f;background:#ffffff08;border-radius:0 12px 12px 0;color:#e8e0d1;line-height:1.6}.city-status{min-height:20px;margin-top:12px;color:#e6c47e;font-size:12px}.city-panel-foot{display:flex;gap:9px;justify-content:flex-end;margin-top:18px}.city-panel-foot .city-action{min-width:104px;min-height:42px}.city-death-count{margin:14px 0;color:#ffb2a5;font-weight:850}.city-death-note{color:#bbb7aa;font-size:13px;line-height:1.55}
    #cityBagTouch{position:fixed;left:12px;top:68px;z-index:8;display:none;min-width:56px;height:42px;padding:0 11px;border:1px solid #ffffff55;border-radius:12px;background:#111613df;color:#f2d08c;font-size:10px;font-weight:950;backdrop-filter:blur(10px);touch-action:manipulation}#cityBagTouch.show{display:block}
    #cityInteractTouch{min-height:42px;padding:0 8px;border:1px solid #edc67599;border-radius:12px;background:#dca94924;color:#f6d99e;font-size:10px;font-weight:950;touch-action:manipulation}#cityInteractTouch[hidden]{display:none!important}

    #cityHotbar{position:fixed;left:50%;bottom:18px;z-index:6;display:none;transform:translateX(-50%);gap:5px;padding:6px;border:1px solid #ffffff30;border-radius:15px;background:#101411dc;box-shadow:0 8px 28px #0008;backdrop-filter:blur(12px);pointer-events:auto}#cityHotbar.show{display:flex}.city-hot-slot{position:relative;width:56px;height:58px;display:grid;place-items:center;border:1px solid #ffffff1a;border-radius:10px;background:#ffffff08;color:#f5ead6}.city-hot-slot.active{border-color:#f3cb72;background:#d5a34d27;box-shadow:inset 0 0 0 1px #f3cb7244}.city-hot-key{position:absolute;left:5px;top:3px;color:#d5bd89;font-size:9px;font-weight:900}.city-hot-icon{font-size:22px}.city-hot-qty{position:absolute;right:5px;bottom:3px;color:#f4d187;font-size:9px;font-weight:900}.city-hot-name{max-width:48px;overflow:hidden;color:#c7c0b2;font-size:8px;text-overflow:ellipsis;white-space:nowrap}
    #cityMapUi{position:fixed;left:18px;top:80px;z-index:7;display:none}#cityMapUi.show{display:block}#cityMiniMap{width:170px;height:170px;display:block;border:2px solid #e5d6b288;border-radius:50%;background:#1118;box-shadow:0 12px 35px #0008}#cityMapTouch{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);padding:6px 12px;border:1px solid #e8bd6b88;border-radius:999px;background:#141915ed;color:#f2d08c;font-size:9px;font-weight:950;letter-spacing:.12em}
    #cityMapOverlay{z-index:16}.city-map-panel{width:min(900px,100%);max-height:94dvh;padding:18px;border:1px solid #e7c47b66;border-radius:22px;background:linear-gradient(145deg,#1a201b,#0d110e);box-shadow:0 24px 90px #000b;color:#f2eadb}.city-map-head{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:4px 4px 12px}.city-map-head h2{margin:0;color:#f2d08c;font-size:22px}.city-map-body{display:grid;grid-template-columns:minmax(0,1fr) 180px;align-items:start;gap:14px}.city-map-canvas-wrap{max-height:calc(94dvh - 90px);overflow:auto;border-radius:15px;background:#0b100d}.city-map-canvas{display:block;width:min(100%,760px);height:auto;aspect-ratio:1;border:1px solid #ffffff18;border-radius:14px}.city-map-legend{display:grid;gap:9px;padding:13px;border:1px solid #ffffff16;border-radius:14px;background:#ffffff08}.city-map-legend strong{color:#efcf8c;font-size:12px}.city-map-legend span{color:#d2cbbb;font-size:11px}.city-map-swatch{display:inline-block;width:10px;height:10px;margin-right:7px;border-radius:50%;vertical-align:middle}.city-character-card{display:grid;grid-template-columns:78px 1fr;align-items:center;gap:12px;margin-bottom:15px;padding:14px;border:1px solid #e3b85b34;border-radius:15px;background:linear-gradient(100deg,#d5a34d18,#ffffff05)}.city-character-ascii{display:grid;place-items:center;width:70px;height:70px;border-radius:15px;background:#e5bc6822;font-size:42px}.city-character-card strong{display:block;color:#f2d08c;font-size:13px}.city-character-card small{display:block;margin-top:5px;color:#c0bbad;font-size:11px;line-height:1.45}.city-gear-line{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 13px}.city-gear-chip{padding:9px;border:1px solid #ffffff19;border-radius:10px;background:#ffffff07;color:#ddd3c1;font-size:10px}.city-gear-chip b{display:block;margin-top:4px;color:#f1d08c;font-size:11px}
    @media(max-width:760px){#cityHotbar{bottom:calc(76px + env(safe-area-inset-bottom));gap:3px;padding:4px}.city-hot-slot{width:42px;height:45px}.city-hot-icon{font-size:17px}.city-hot-name{max-width:36px;font-size:7px}#cityMapUi{top:78px;left:10px}#cityMiniMap{width:112px;height:112px}.city-map-body{grid-template-columns:1fr}.city-map-legend{grid-template-columns:repeat(2,minmax(0,1fr))}.city-map-canvas-wrap{max-height:calc(78dvh - 90px)}.city-map-canvas{width:min(100%,560px)}.city-character-card{grid-template-columns:58px 1fr}.city-character-ascii{width:54px;height:54px;font-size:32px}}
    @media(max-width:760px){#cityHud{top:10px;right:10px;min-width:137px;padding:8px 10px;border-radius:12px;font-size:10px}.city-wallet strong{font-size:15px}.city-hearts{font-size:12px}.city-overlay{padding:10px}.city-panel{max-height:calc(100dvh - 20px);padding:18px;border-radius:18px}.city-panel-head{margin-bottom:5px}.city-subtitle{margin:7px 0 15px}.city-list{grid-template-columns:1fr 1fr;gap:7px}.city-item{grid-template-columns:30px 1fr;padding:9px;gap:4px 7px}.city-item-icon{width:29px;height:29px;font-size:17px}.city-item-title{font-size:11px}.city-item-description{font-size:10px;min-height:27px}.city-item-footer{align-items:flex-end}.city-price{font-size:10px}.city-item-footer .city-action{min-height:31px;padding:0 8px;font-size:10px}.city-bag-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.city-bag-slot{min-height:95px;padding:9px}.city-bag-actions .city-action{font-size:9px}.city-panel-foot .city-action{min-height:40px}}
    @media(max-width:360px){#cityHud{min-width:126px}.city-list{grid-template-columns:1fr}.city-item-description{min-height:0}.city-bag-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  document.body.insertAdjacentHTML('beforeend', `
    <aside id="cityHud" aria-live="polite">
      <div class="city-wallet"><span>ŞEHİR CÜZDANI</span><strong>₺ <b id="cityCashValue">0</b></strong></div>
      <div class="city-vitals"><div id="cityHearts" class="city-hearts" aria-label="Can"></div><div id="cityStars" class="city-stars" aria-label="Aranma seviyesi"></div></div><div id="cityPoliceTimer" class="city-police-timer" hidden></div>
    </aside>
    <button id="cityBagTouch" type="button" aria-label="Çantayı aç">ÇANTA</button>
    <div id="cityMapUi"><canvas id="cityMiniMap" width="220" height="220" aria-label="Şehir mini haritası"></canvas><button id="cityMapTouch" type="button">HARİTA · M</button></div>
    <div id="cityHotbar" aria-label="Hızlı eşya kuşağı"></div>
    <section id="cityMapOverlay" class="city-overlay" aria-hidden="true"><div class="city-map-panel"><div class="city-map-head"><div><h2>ŞEHİR HARİTASI</h2><small class="city-subtitle">M ile aç/kapat · 1–6 hızlı eşya seçimi</small></div><button class="city-close" data-close="map" aria-label="Haritayı kapat">×</button></div><div class="city-map-body"><div class="city-map-canvas-wrap"><canvas id="cityFullMap" class="city-map-canvas" width="900" height="900" aria-label="Tüm şehir haritası"></canvas></div><div class="city-map-legend"><strong>HARİTA İŞARETLERİ</strong><span><i class="city-map-swatch" style="background:#f1d06e"></i>Eşek</span><span><i class="city-map-swatch" style="background:#ec7465"></i>Polis</span><span><i class="city-map-swatch" style="background:#d9aaa0"></i>Hastane</span><span><i class="city-map-swatch" style="background:#77a8df"></i>Polis merkezi</span><span><i class="city-map-swatch" style="background:#e18267"></i>İtfaiye</span><span><i class="city-map-swatch" style="background:#b1adb0"></i>Hapishane</span><span><i class="city-map-swatch" style="background:#5d7860"></i>Park</span><span><i class="city-map-swatch" style="background:#57988a"></i>Saklanma noktası</span></div></div></div></section>
    <section id="cityShopOverlay" class="city-overlay" aria-hidden="true"><div class="city-panel">
      <div class="city-panel-head"><div><h2 id="cityShopTitle">Dükkân</h2><p id="cityShopSubtitle" class="city-subtitle">Tezgâhtaki ürünler</p></div><button class="city-close" data-close="shop" aria-label="Kapat">×</button></div>
      <div id="cityShopItems" class="city-list"></div><div id="cityShopStatus" class="city-status"></div>
      <div class="city-panel-foot"><button class="city-action" data-close="shop">KAPAT</button></div>
    </div></section>
    <section id="cityBagOverlay" class="city-overlay" aria-hidden="true"><div class="city-panel">
      <div class="city-panel-head"><div><h2>ÇANTA & TEÇHİZAT</h2><p class="city-subtitle">B ile aç/kapat · 1–6 hızlı kullanım · <span id="cityBagCapacity">12</span> eşya yuvası</p></div><button class="city-close" data-close="bag" aria-label="Kapat">×</button></div>
      <div class="city-character-card"><div class="city-character-ascii" aria-hidden="true">🫏</div><div><strong>EŞEK · OYUNCU DURUMU</strong><small>Can ve para bilgisi şehir HUD’ında. Eşyayı hızlı kuşağa ata, numara tuşuyla kullan/kuşan.</small></div></div><div class="city-gear-line"><div class="city-gear-chip">Yakın dövüş<b id="cityEquippedWeapon">Yumruk</b></div><div class="city-gear-chip">Koruma<b id="cityEquippedArmor">Yok</b></div></div>
      <div id="cityBagItems" class="city-bag-grid"></div><div id="cityBagStatus" class="city-status"></div>
      <div class="city-panel-foot"><button class="city-action" data-close="bag">KAPAT</button></div>
    </div></section>
    <section id="cityTalkOverlay" class="city-overlay" aria-hidden="true"><div class="city-panel narrow">
      <div class="city-panel-head"><div><h2 id="cityTalkName">Mahalleli</h2><p id="cityTalkMood" class="city-subtitle"></p></div><button class="city-close" data-close="talk" aria-label="Kapat">×</button></div>
      <div id="cityTalkLine" class="city-talk-line"></div><div id="cityTalkStatus" class="city-status"></div>
      <div class="city-panel-foot"><button class="city-action" id="cityTalkAgain">KONUŞ</button><button class="city-action" data-close="talk">AYRIL</button></div>
    </div></section>
    <section id="cityHospitalOverlay" class="city-overlay" aria-hidden="true"><div class="city-panel narrow">
      <div class="city-panel-head"><div><h2>Şehir Hastanesi</h2><p class="city-subtitle">Sağlık görevlisi seni muayene edebilir.</p></div><button class="city-close" data-close="hospital" aria-label="Kapat">×</button></div>
      <p class="city-talk-line">Hastanede tamamen iyileşmek için ₺35 öde. Ölürsen, ceza kesildikten sonra burada yeniden doğarsın.</p><div id="cityHospitalStatus" class="city-status"></div>
      <div class="city-panel-foot"><button class="city-action" id="cityHospitalHeal">TEDAVİ OL · ₺35</button><button class="city-action" data-close="hospital">KAPAT</button></div>
    </div></section>
    <section id="cityDeathOverlay" class="city-overlay" aria-hidden="true"><div class="city-panel narrow">
      <div class="city-panel-head"><div><h2>Hastaneye kaldırıldın</h2><p class="city-subtitle">Şehir Hastanesi</p></div></div>
      <p id="cityDeathReason" class="city-death-note">Canın tükendi.</p><p id="cityDeathFine" class="city-death-count">Hastane masrafı: ₺0</p>
      <p class="city-death-note">Kısa süre sonra hastanede yeniden doğacaksın.</p><div class="city-panel-foot"><button id="cityRespawnNow" class="city-action">YENİDEN DOĞ</button></div>
    </div></section>
  `);

  const hud = byId('cityHud');
  const hearts = byId('cityHearts');
  const heartNodes = Array.from({ length: 9 }, () => {
    const node = document.createElement('span'); node.className = 'city-heart'; node.textContent = '♥'; hearts.appendChild(node); return node;
  });
  const doorControls = byId('doorControls');
  const interactButton = document.createElement('button');
  interactButton.id = 'cityInteractTouch'; interactButton.type = 'button'; interactButton.hidden = true; interactButton.textContent = 'ETKİLEŞ';
  doorControls.insertBefore(interactButton, doorControls.firstChild);

  const profile = { cash: 0, inventory: [], capacity: DATA.bagCapacity, health: 9, maxHealth: 9, wantedLevel: 0, policeActive: false, policeSearchEndsAt: 0, equippedWeapon: null, equippedArmor: null };
  let activeShopId = null;
  let activeCitizenId = null;
  let cityDeathTimer = null;
  let respawnRequested = false;
  let context = null;
  let canonicalShopItems = null;

  function isOverlayOpen() {
    return ['cityMapOverlay','cityShopOverlay','cityBagOverlay','cityTalkOverlay','cityHospitalOverlay','cityDeathOverlay'].some((id) => byId(id).classList.contains('open'));
  }
  function openOverlay(id) { const overlay = byId(id); overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); }
  function closeOverlay(id) { const overlay = byId(id); overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); }
  function closeAllOverlays() { for (const id of ['cityMapOverlay','cityShopOverlay', 'cityBagOverlay', 'cityTalkOverlay', 'cityHospitalOverlay']) closeOverlay(id); }
  let selectedQuickSlot=0;
  const mapFootprints=DATA.getAllBuildingFootprints(),mapHideSpots=DATA.getAllStreetProps();
  function toggleMap(){if(state.screen!=='game'||!state.playing||state.paused)return false;const isOpen=byId('cityMapOverlay').classList.contains('open');if(isOpen){closeOverlay('cityMapOverlay');return true}closeAllOverlays();openOverlay('cityMapOverlay');drawCityMaps(true);return true;}
  function drawCityMaps(force=false){if(!state.playing||state.screen!=='game')return;const mini=byId('cityMiniMap'),full=byId('cityFullMap'),fullOpen=byId('cityMapOverlay').classList.contains('open');if(!force&&!fullOpen&&drawCityMaps.last&&Date.now()-drawCityMaps.last<180)return;drawCityMaps.last=Date.now();const roads=DATA.roadLines,last=roads[roads.length-1],first=roads[0];
    const draw=(canvas,rotating)=>{const ctx=canvas.getContext('2d'),size=canvas.width,center=size/2,range=rotating?72:last-first+28,scale=size/range;ctx.clearRect(0,0,size,size);ctx.save();if(rotating){ctx.beginPath();ctx.arc(center,center,center-2,0,Math.PI*2);ctx.clip()}ctx.fillStyle='#111713';ctx.fillRect(0,0,size,size);
      const point=(x,z)=>{if(rotating){const dx=x-player.position.x,dz=z-player.position.z,yaw=state.yaw||0,right=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw);return{x:center+right*scale,y:center-forward*scale}}return{x:(x-first+14)*scale,y:(last+14-z)*scale}};
      for(let ix=0;ix<DATA.blockCount;ix++)for(let iz=0;iz<DATA.blockCount;iz++){const bounds=DATA.getBlockBounds(ix,iz),plan=DATA.getBlockPlan(ix,iz),corners=[[bounds.left,bounds.front],[bounds.right,bounds.front],[bounds.right,bounds.back],[bounds.left,bounds.back]].map(([x,z])=>point(x,z));ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=plan.landUse==='pocket-park'?'#415a45':'#252b27';ctx.fill();ctx.strokeStyle='#39413a';ctx.lineWidth=1;ctx.stroke()}
      ctx.strokeStyle='#626967';for(const line of roads){const a=point(line,first-18),b=point(line,last+18),c=point(first-18,line),d=point(last+18,line);ctx.lineWidth=Math.max(1.2,DATA.roadWidth(line)*scale);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.stroke()}
      for(const building of mapFootprints){const c=Math.cos(building.face||0),sn=Math.sin(building.face||0),corners=[[-building.width/2,-building.depth/2],[building.width/2,-building.depth/2],[building.width/2,building.depth/2],[-building.width/2,building.depth/2]].map(([x,z])=>point(building.x+c*x+sn*z,building.z-sn*x+c*z));ctx.beginPath();corners.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle=building.kind==='police-station'?'#526e8d':building.kind==='fire-station'?'#b95745':building.kind==='prison'?'#777578':building.kind==='hospital'?'#b97875':'#8b8e85';ctx.fill()}
      for(const prop of mapHideSpots){const p=point(prop.x,prop.z);ctx.fillStyle='#57988a';ctx.fillRect(p.x-1.6,p.y-1.6,3.2,3.2)}
      const specialColors={'city-police-station':'#7aa7df','city-fire-station':'#ef876a','city-prison':'#d0c8cd','city-hospital':'#e0a19c'};for(const [id,color] of Object.entries(specialColors)){const building=mapFootprints.find(entry=>entry.id===id);if(!building)continue;const p=point(building.x,building.z);ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,rotating?3.2:7,0,Math.PI*2);ctx.fill()}
      const me=point(player.position.x,player.position.z);ctx.save();ctx.translate(me.x,me.y);ctx.rotate(state.yaw||0);ctx.fillStyle='#f1d06e';ctx.beginPath();ctx.moveTo(0,-(rotating?8:14));ctx.lineTo(rotating?5:9,rotating?6:10);ctx.lineTo(0,rotating?3:6);ctx.lineTo(rotating?-5:-9,rotating?6:10);ctx.closePath();ctx.fill();ctx.restore();ctx.restore()};draw(mini,true);if(fullOpen)draw(full,false)}
  function renderHotbar(){const bar=byId('cityHotbar');if(!bar)return;bar.replaceChildren();for(let index=0;index<6;index++){const entry=profile.inventory[index],item=entry&&itemFor(entry.id),button=document.createElement('button');button.type='button';button.className=`city-hot-slot${index===selectedQuickSlot?' active':''}`;button.dataset.quickSlot=String(index);button.setAttribute('aria-label',item?`${index+1}: ${item.name}`:`${index+1}: boş`);const key=document.createElement('span');key.className='city-hot-key';key.textContent=String(index+1);const icon=document.createElement('span');icon.className='city-hot-icon';icon.textContent=item?.icon||'·';const name=document.createElement('span');name.className='city-hot-name';name.textContent=item?.name||'Boş';button.append(key,icon,name);if(entry?.quantity>1){const quantity=document.createElement('span');quantity.className='city-hot-qty';quantity.textContent=`×${entry.quantity}`;button.appendChild(quantity)}bar.appendChild(button)}}
  function selectQuickSlot(index){if(index<0||index>5)return false;selectedQuickSlot=index;renderHotbar();const entry=profile.inventory[index],item=entry&&itemFor(entry.id);if(item?.kind==='food')send('city_use',{itemId:item.id});else if(item?.kind==='weapon'||item?.kind==='armor')send('city_equip',{itemId:item.id});else if(item)showToast(`${item.name} hızlı kuşağa seçildi.`);return true}
  window.setInterval(()=>{if(state.screen==='game'&&state.playing)drawCityMaps()},180);

  function renderHud() {
    byId('cityCashValue').textContent = Math.max(0, Math.floor(profile.cash || 0)).toLocaleString('tr-TR');
    const hp = Math.max(0, Number(profile.health) || 0);
    const maxHp = Math.max(1, Number(profile.maxHealth) || 9);
    const filledHearts = Math.ceil(Math.min(1, hp / maxHp) * 9);
    heartNodes.forEach((node, index) => node.classList.toggle('full', index < filledHearts));
    const wanted = Math.max(0, Math.min(5, Number(profile.wantedLevel) || 0));
    byId('cityStars').innerHTML = Array.from({ length: 5 }, (_, i) => `<span class="${i < wanted ? 'wanted' : ''}">★</span>`).join('');
    updatePoliceTimer();
    byId('cityBagCapacity').textContent = String(profile.capacity || DATA.bagCapacity);
    byId('cityEquippedWeapon').textContent=itemFor(profile.equippedWeapon)?.name||'Yumruk';
    byId('cityEquippedArmor').textContent=itemFor(profile.equippedArmor)?.name||'Yok';
    renderHotbar();
  }

  function itemFor(id) { return DATA.items.find((item) => item.id === id); }
  function addLocalCash(amount = 10) {
    profile.cash = Math.max(0, profile.cash + Math.max(1, Math.floor(Number(amount) || 10)));
    renderHud();
    showToast(`İnsan para düşürdü: ₺${Math.max(1, Math.floor(Number(amount) || 10))}`);
  }

  function renderShop() {
    const shop = DATA.shops.find((entry) => entry.id === activeShopId);
    if (!shop) return;
    byId('cityShopTitle').textContent = shop.title;
    byId('cityShopSubtitle').textContent = `Tezgâhtaki ürünler · Cüzdan: ₺${Math.floor(profile.cash).toLocaleString('tr-TR')}`;
    const listed = canonicalShopItems || shop.items.map(itemFor).filter(Boolean);
    const container = byId('cityShopItems'); container.replaceChildren();
    if (!listed.length) { container.innerHTML = '<div class="city-empty">Bu dükkânda şu an ürün yok.</div>'; return; }
    for (const item of listed) {
      const card = document.createElement('article'); card.className = 'city-item';
      const icon = document.createElement('div'); icon.className = 'city-item-icon'; icon.textContent = item.icon || '📦';
      const title = document.createElement('strong'); title.className = 'city-item-title'; title.textContent = item.name;
      const description = document.createElement('small'); description.className = 'city-item-description'; description.textContent = item.description || item.category || '';
      const footer = document.createElement('div'); footer.className = 'city-item-footer';
      const price = document.createElement('span'); price.className = 'city-price'; price.textContent = `₺${Number(item.price || 0).toLocaleString('tr-TR')}`;
      const buy = document.createElement('button'); buy.className = 'city-action'; buy.type = 'button'; buy.textContent = 'SATIN AL'; buy.dataset.buyItem = item.id; buy.disabled = profile.cash < item.price;
      footer.append(price, buy); card.append(icon, title, description, footer); container.appendChild(card);
    }
  }

  function renderBag() {
    const container = byId('cityBagItems'); container.replaceChildren();
    const inventory = Array.isArray(profile.inventory) ? profile.inventory : [];
    if (!inventory.length) { const empty = document.createElement('div'); empty.className = 'city-empty'; empty.textContent = 'Çantan boş. Bir dükkâna girip E ile alışveriş yapabilirsin.'; container.appendChild(empty); return; }
    for (const entry of inventory) {
      const item = itemFor(entry.id);
      if (!item) continue;
      const slot = document.createElement('article'); slot.className = 'city-bag-slot';
      const icon = document.createElement('span'); icon.textContent = item.icon || '📦';
      const title = document.createElement('strong'); title.textContent = `${item.name}${entry.quantity > 1 ? ` ×${entry.quantity}` : ''}`;
      const kind = document.createElement('small'); kind.textContent = item.category || 'Eşya';
      slot.append(icon, title, kind);
      if (['weapon', 'armor', 'food'].includes(item.kind)) {
        const actions = document.createElement('div'); actions.className = 'city-bag-actions';
        const button = document.createElement('button'); button.className = 'city-action'; button.type = 'button'; button.dataset.itemAction = item.kind === 'food' ? 'use' : 'equip'; button.dataset.itemId = item.id;
        const equipped = item.kind === 'weapon' ? profile.equippedWeapon === item.id : profile.equippedArmor === item.id;
        button.textContent = item.kind === 'food' ? 'KULLAN' : (equipped ? 'KUŞANILDI' : 'KUŞAN');
        if (equipped) button.disabled = true;
        actions.appendChild(button); slot.appendChild(actions);
      }
      container.appendChild(slot);
    }
  }

  function updatePoliceTimer() {
    const timer = byId('cityPoliceTimer');
    if (!timer) return;
    if (!profile.policeActive || !profile.policeSearchEndsAt) { timer.hidden=true;timer.textContent='';return; }
    const remaining=Math.max(0,Math.ceil((profile.policeSearchEndsAt-Date.now())/1000));
    const minutes=Math.floor(remaining/60),seconds=remaining%60;timer.hidden=remaining<=0;timer.textContent=remaining>0?`POLİS ARAMASI · ${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`:'';
  }
  window.setInterval(updatePoliceTimer,250);

  function setProfile(snapshot = {}) {
    profile.cash = Math.max(0, Number(snapshot.cash ?? profile.cash) || 0);
    profile.inventory = Array.isArray(snapshot.inventory) ? snapshot.inventory.map((entry) => ({ id: String(entry.id), quantity: Math.max(1, Number(entry.quantity) || 1) })) : profile.inventory;
    profile.capacity = Math.max(1, Number(snapshot.capacity) || DATA.bagCapacity);
    profile.health = Math.max(0, Number(snapshot.health ?? profile.health) || 0);
    profile.maxHealth = Math.max(1, Number(snapshot.maxHealth) || 9);
    profile.wantedLevel = Math.max(0, Math.min(5, Number(snapshot.wantedLevel ?? profile.wantedLevel) || 0));
    profile.policeActive = snapshot.policeActive === undefined ? (profile.wantedLevel > 0 && profile.policeActive) : !!snapshot.policeActive;
    profile.policeSearchEndsAt = Number(snapshot.policeSearchEndsAt ?? profile.policeSearchEndsAt) || 0;
    profile.equippedWeapon = snapshot.equippedWeapon ?? profile.equippedWeapon;
    profile.equippedArmor = snapshot.equippedArmor ?? profile.equippedArmor;
    citySimulation.setPoliceWantedLevel(profile.wantedLevel, profile.policeActive);
    renderHud();
    if (byId('cityBagOverlay').classList.contains('open')) renderBag();
    if (byId('cityShopOverlay').classList.contains('open')) renderShop();
  }

  function openShop(shopkeeper) {
    activeShopId = shopkeeper.id;
    canonicalShopItems = null;
    byId('cityShopStatus').textContent = 'Tezgâh hazırlanıyor…';
    closeAllOverlays(); openOverlay('cityShopOverlay'); renderShop();
    send('city_shop_request', { shopId: shopkeeper.id });
  }
  function openCitizen(citizen) {
    activeCitizenId = citizen.id;
    byId('cityTalkName').textContent = citizen.name;
    const mood = citizen.disposition === 'friendly' ? 'Mahalleli · Dost canlısı' : (citizen.disposition === 'aggressive' ? 'Mahalleli · Tedirgin ve kavgacı' : 'Mahalleli · Tarafsız');
    byId('cityTalkMood').textContent = mood;
    byId('cityTalkLine').textContent = citizen.dialogue || 'Sana şöyle bir bakıp yoluna devam ediyor.';
    byId('cityTalkStatus').textContent = '';
    closeAllOverlays(); openOverlay('cityTalkOverlay');
    send('city_npc_interact', { npcId: citizen.id });
  }
  function openHospital() {
    byId('cityHospitalStatus').textContent = '';
    closeAllOverlays(); openOverlay('cityHospitalOverlay');
  }
  function currentContext() {
    const shopkeeper = citySimulation.getNearestShopkeeper(player.position, 3.9);
    if (shopkeeper) return { kind: shopkeeper.id === 'city-hospital' ? 'hospital' : 'shop', actor: shopkeeper };
    const citizen = citySimulation.getNearestCitizen(player.position, 3.4);
    if (citizen) return { kind: 'citizen', actor: citizen };
    return null;
  }

  function interact() {
    if (isOverlayOpen()) return true;
    if (state.screen !== 'game' || !state.playing || state.paused || !player.visible) return false;
    context = currentContext();
    if (context?.kind === 'shop') { openShop(context.actor); return true; }
    if (context?.kind === 'citizen') { openCitizen(context.actor); return true; }
    if (context?.kind === 'hospital') { openHospital(); return true; }
    return false;
  }
  function toggleBag() {
    if (state.screen !== 'game' || !state.playing || state.paused) return false;
    if (byId('cityBagOverlay').classList.contains('open')) { closeOverlay('cityBagOverlay'); return true; }
    closeAllOverlays(); renderBag(); openOverlay('cityBagOverlay'); return true;
  }
  function updateInteractionUi() {
    const active = state.screen === 'game' && state.playing && !state.paused;
    context = active ? currentContext() : null;
    const nearbyDoor = context ? null : (active ? enterableWorld.getNearbyDoor(player.position) : null);
    const nearbyHideSpot = active ? getNearbyHideSpot() : null;
    const showAction = active && !!context;
    interactButton.hidden = !showAction;
    interactButton.textContent = context?.kind === 'shop' ? 'ALIŞVERİŞ' : (context?.kind === 'citizen' ? 'KONUŞ' : (context?.kind === 'hospital' ? 'HASTANE' : 'ETKİLEŞ'));
    doorControls.classList.toggle('show', active && state.mode === 'mobile' && (!!nearbyDoor || showAction));
    const hideButton = byId('hideTouch');
    hideButton.textContent = state.hidden ? 'ÇIK' : 'SAKLAN';
    hideButton.setAttribute('aria-label', state.hidden ? 'Saklanma yerinden çık (H)' : (nearbyHideSpot ? 'Çöp kutusuna saklan (H)' : 'Saklan (H)'));
    return { context, nearbyDoor, nearbyHideSpot };
  }

  function handleEscape() {
    if (!isOverlayOpen()) return false;
    if (byId('cityDeathOverlay').classList.contains('open')) return true;
    closeAllOverlays(); return true;
  }
  function handleKeydown(event) {
    if (event.code === 'Escape' && handleEscape()) return true;
    if (event.target?.tagName === 'INPUT') return false;
    if (event.code === 'KeyM' && !event.repeat) return toggleMap();
    if (/^Digit[1-6]$/.test(event.code) && !event.repeat && state.screen==='game' && state.playing) { selectQuickSlot(Number(event.code.slice(-1))-1); return true; }
    if (event.code === 'KeyB' && !event.repeat) return toggleBag();
    if (event.code === 'KeyE' && !event.repeat) return interact();
    return false;
  }

  function handleMessage(message) {
    if (message.type === 'needs') {
      const previousHealth = profile.health;
      setProfile({ health: message.health, maxHealth: message.maxHealth });
      if (Number(message.health) < Number(previousHealth)) onPlayerHit();
      return;
    }
    if (message.type === 'city_state') {
      setProfile(message.state || {});
      return;
    }
    if (message.type === 'city_hide_state') { state.hidden=!!message.hidden;player.visible=!state.hidden;byId('hideTouch').textContent=state.hidden?'ÇIK':'SAKLAN';return; }
    if (message.type === 'city_police_timer') {
      profile.policeActive = true;
      profile.policeSearchEndsAt = Number(message.searchEndsAt) || 0;
      updatePoliceTimer();
      return;
    }
    if (message.type === 'city_citizens') {
      citySimulation.setCitizenStates(message.citizens || []);
      return;
    }
    if (message.type === 'city_citizen_state') {
      citySimulation.setCitizenState(message.citizen || {});
      return;
    }
    if (message.type === 'city_citizen_attack') {
      citySimulation.animateCitizenAttack(message.npcId);
      if (message.targetId === state.myId) onPlayerHit();
      return;
    }
    if (message.type === 'city_shop_open') {
      activeShopId = message.shopId || activeShopId;
      canonicalShopItems = Array.isArray(message.items) ? message.items : [];
      byId('cityShopStatus').textContent = '';
      renderShop();
      return;
    }
    if (message.type === 'city_npc_dialogue') {
      if (message.npcId === activeCitizenId && message.line) byId('cityTalkLine').textContent = message.line;
      return;
    }
    if (message.type === 'city_action_result') {
      const status = byId('cityShopOverlay').classList.contains('open') ? byId('cityShopStatus') : (byId('cityBagOverlay').classList.contains('open') ? byId('cityBagStatus') : byId('cityHospitalStatus'));
      status.textContent = message.message || (message.ok ? 'Tamamlandı.' : 'İşlem yapılamadı.');
      if (message.state) setProfile(message.state);
      else renderHud();
      if (byId('cityBagOverlay').classList.contains('open')) renderBag();
      if (byId('cityShopOverlay').classList.contains('open')) renderShop();
      return;
    }
    if (message.type === 'city_death') {
      const fine = Math.max(0, Number(message.fine) || 0);
      byId('cityDeathReason').textContent = message.reason || 'Canın tükendi.';
      byId('cityDeathFine').textContent = `Hastane masrafı: ₺${fine.toLocaleString('tr-TR')}`;
      closeAllOverlays(); openOverlay('cityDeathOverlay');
      if (cityDeathTimer) clearTimeout(cityDeathTimer);
      respawnRequested = false;
      cityDeathTimer = setTimeout(requestRespawn, 5000);
      return;
    }
    if (message.type === 'player_death' && message.id === state.myId) {
      state.paused = true;
      if (!byId('cityDeathOverlay').classList.contains('open')) {
        byId('cityDeathReason').textContent = message.reason || 'Canın tükendi.';
        byId('cityDeathFine').textContent = 'Hastane masrafı uygulanıyor…';
        closeAllOverlays(); openOverlay('cityDeathOverlay');
        cityDeathTimer = setTimeout(requestRespawn, 5000);
      }
      return;
    }
    if (message.type === 'respawned') {
      if (cityDeathTimer) clearTimeout(cityDeathTimer);
      cityDeathTimer = null; respawnRequested = false;
      const spawn = message.spawn || DATA.hospitalSpawn;
      player.position.set(Number(spawn.x) || 0, Number(spawn.y) || 0, Number(spawn.z) || 0);
      player.visible = true; state.playing = true; state.paused = false; state.jumpY = 0; state.jumpVelocity = 0;
      profile.policeActive = false; profile.policeSearchEndsAt = 0;
      citySimulation.setPoliceWantedLevel(0, false);
      closeOverlay('cityDeathOverlay');
      if (message.state) setProfile({ health: message.state.health, maxHealth: message.state.maxHealth, wantedLevel: 0 });
      showToast('Şehir Hastanesinde yeniden doğdun.');
    }
  }

  function requestRespawn() {
    if (respawnRequested || !state.playing) return;
    respawnRequested = true;
    send('respawn');
  }

  byId('cityShopItems').addEventListener('click', (event) => {
    const button = event.target.closest('[data-buy-item]');
    if (!button || !activeShopId) return;
    send('city_buy', { shopId: activeShopId, itemId: button.dataset.buyItem });
  });
  byId('cityBagItems').addEventListener('click', (event) => {
    const button = event.target.closest('[data-item-action]');
    if (!button) return;
    send(button.dataset.itemAction === 'use' ? 'city_use' : 'city_equip', { itemId: button.dataset.itemId });
  });
  byId('cityTalkAgain').addEventListener('click', () => { if (activeCitizenId) send('city_npc_interact', { npcId: activeCitizenId }); });
  byId('cityHospitalHeal').addEventListener('click', () => send('city_hospital_heal'));
  byId('cityRespawnNow').addEventListener('click', requestRespawn);
  document.body.addEventListener('click', (event) => {
    const close = event.target.closest('[data-close]');
    if (close) { closeOverlay(({ map:'cityMapOverlay',shop: 'cityShopOverlay', bag: 'cityBagOverlay', talk: 'cityTalkOverlay', hospital: 'cityHospitalOverlay' })[close.dataset.close]); return; }
  });
  for (const id of ['cityMapOverlay','cityShopOverlay', 'cityBagOverlay', 'cityTalkOverlay', 'cityHospitalOverlay']) {
    byId(id).addEventListener('click', (event) => { if (event.target === byId(id)) closeOverlay(id); });
  }
  byId('cityBagTouch').addEventListener('click', toggleBag);
  byId('cityMapTouch').addEventListener('click',toggleMap);
  byId('cityHotbar').addEventListener('click',event=>{const button=event.target.closest('[data-quick-slot]');if(button)selectQuickSlot(Number(button.dataset.quickSlot))});
  byId('cityMapOverlay').addEventListener('click',event=>{if(event.target===byId('cityMapOverlay'))closeOverlay('cityMapOverlay')});
  interactButton.addEventListener('click', () => interact());

  function onScreenChange(screen, mode) {
    hud.classList.toggle('show', screen === 'game');
    byId('cityMapUi').classList.toggle('show',screen==='game');
    byId('cityHotbar').classList.toggle('show',screen==='game');
    byId('cityBagTouch').classList.toggle('show', screen === 'game' && mode === 'mobile');
    if (screen !== 'game') closeAllOverlays();
  }
  function attackTarget() { const forward = { x: Math.sin(state.yaw), z: Math.cos(state.yaw) }; return citySimulation.getNearestHuman(player.position, 2.85, forward); }

  renderHud();
  return { handleKeydown, handleEscape, handleMessage, interact, toggleBag, toggleMap, updateInteractionUi, onScreenChange, setProfile, attackTarget, addLocalCash, get profile() { return profile; } };
}
