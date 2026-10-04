(function (root, factory) {
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.EsekCityData = data;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  const roadLines = Object.freeze([-126, -84, -42, 0, 42, 84, 126]);
  const roadWidth = (value) => Math.abs(value) < 0.01 ? 14 : (Math.abs(value) < 50 ? 10 : 8.5);

  function getBuildingSlot(slot) {
    const [ix, iz, index] = String(slot).split(':').map(Number);
    if (![ix, iz, index].every(Number.isInteger) || ix < 0 || ix >= 6 || iz < 0 || iz >= 6) return null;
    const left = roadLines[ix] + roadWidth(roadLines[ix]) / 2 + 4.15;
    const right = roadLines[ix + 1] - roadWidth(roadLines[ix + 1]) / 2 - 4.15;
    const front = roadLines[iz] + roadWidth(roadLines[iz]) / 2 + 4.15;
    const back = roadLines[iz + 1] - roadWidth(roadLines[iz + 1]) / 2 - 4.15;
    const smallWidth = Math.min(8.6, (right - left - 4.5) / 2);
    const smallDepth = Math.min(8.4, (back - front - 4.5) / 2);
    const outerBlock = ix === 0 || iz === 0 || ix === 5 || iz === 5;
    const centers = outerBlock ? [[-1, -1], [1, 1]] : [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    const signs = centers[index];
    if (!signs) return null;
    const [sx, sz] = signs;
    return {
      x: (left + right) / 2 + sx * (smallWidth / 2 + 1.65),
      z: (front + back) / 2 + sz * (smallDepth / 2 + 1.65),
      width: smallWidth,
      depth: smallDepth,
      face: (ix + iz + index) % 4 === 0 ? Math.PI / 2 : ((ix + iz + index) % 4 === 1 ? -Math.PI / 2 : ((ix + iz + index) % 4 === 2 ? 0 : Math.PI)),
    };
  }

  const items = Object.freeze([
    { id: 'icecream', name: 'Dondurma', icon: '🍦', category: 'Yiyecek', kind: 'food', price: 8, heal: 0.25, stackable: true, description: 'Serinletici bir atıştırmalık.' },
    { id: 'bottled_water', name: 'Su', icon: '💧', category: 'Yiyecek', kind: 'food', price: 6, heal: 0.2, stackable: true, description: 'Küçük bir enerji takviyesi.' },
    { id: 'coffee', name: 'Sıcak kahve', icon: '☕', category: 'Yiyecek', kind: 'food', price: 10, heal: 0.3, stackable: true, description: 'Biraz toparlanmana yardım eder.' },
    { id: 'soup', name: 'Günün çorbası', icon: '🥣', category: 'Yiyecek', kind: 'food', price: 16, heal: 0.8, stackable: true, description: 'Sıcak bir öğün; az miktarda can yeniler.' },
    { id: 'sandwich', name: 'Sandviç', icon: '🥪', category: 'Yiyecek', kind: 'food', price: 13, heal: 0.6, stackable: true, description: 'Yolda yemek için pratik.' },
    { id: 'bread', name: 'Ekmek', icon: '🍞', category: 'Yiyecek', kind: 'food', price: 7, heal: 0.3, stackable: true, description: 'Mahalle fırınından taze ekmek.' },
    { id: 'bandage', name: 'İlk yardım kiti', icon: '🩹', category: 'Sağlık', kind: 'food', price: 28, heal: 2, stackable: true, description: 'Kullanıldığında 2 kalbe kadar can yeniler.' },
    { id: 'wooden_baton', name: 'Tahta sopa', icon: '🪵', category: 'Yakın dövüş', kind: 'weapon', price: 45, damage: 3, range: 3.2, description: 'Yumruğa göre daha etkili, kısa menzilli oyun eşyası.' },
    { id: 'street_baton', name: 'Sağlam cop', icon: '🥢', category: 'Yakın dövüş', kind: 'weapon', price: 95, damage: 4, range: 3.4, description: 'Yakın dövüşte kullanılan oyun eşyası.' },
    { id: 'flashlight', name: 'El feneri', icon: '🔦', category: 'Alet', kind: 'tool', price: 22, description: 'Karanlık sokaklarda kullanabileceğin bir alet.' },
    { id: 'wrench', name: 'İngiliz anahtarı', icon: '🔧', category: 'Alet', kind: 'weapon', price: 36, damage: 2.5, range: 2.8, description: 'Aletçi tezgâhından sağlam bir anahtar.' },
    { id: 'repair_kit', name: 'Tamir kiti', icon: '🧰', category: 'Alet', kind: 'tool', price: 32, description: 'Şehirde saklayabileceğin küçük bir tamir seti.' },
    { id: 'jacket', name: 'Mahalle ceketi', icon: '🧥', category: 'Kıyafet', kind: 'armor', price: 65, damageReduction: 0.1, description: 'Hafif bir ceket; alınan hasarı az miktarda azaltır.' },
    { id: 'safety_vest', name: 'Koruyucu yelek', icon: '🦺', category: 'Kıyafet', kind: 'armor', price: 135, damageReduction: 0.25, description: 'Daha dayanıklı bir oyun içi koruyucu yelek.' },
  ]);

  const shops = Object.freeze([
    { id: 'icecream-shop', slot: '2:3:0', title: 'Dondurmacı', items: ['icecream', 'bottled_water'] },
    { id: 'weapons-shop', slot: '2:3:1', title: 'Silahçı', items: ['wooden_baton', 'street_baton'] },
    { id: 'cafe', slot: '2:3:2', title: 'Kafeci', items: ['coffee', 'soup', 'sandwich'] },
    { id: 'market', slot: '2:3:3', title: 'Marketçi', items: ['bread', 'bottled_water', 'bandage'] },
    { id: 'grocery', slot: '3:2:0', title: 'Bakkal', items: ['bread', 'bottled_water', 'bandage'] },
    { id: 'tool-shop', slot: '3:2:1', title: 'Aletçi', items: ['flashlight', 'wrench', 'repair_kit'] },
    { id: 'clothing-shop', slot: '3:4:2', title: 'Zırh & Kıyafet', items: ['jacket', 'safety_vest'] },
  ]);

  const buildings = Object.freeze([
    ...shops.map((shop) => ({ id: shop.id, slot: shop.slot, title: shop.title, kind: 'shop' })),
    { id: 'home-one', slot: '2:2:3', title: 'Ev', kind: 'home' },
    { id: 'home-two', slot: '4:4:0', title: 'Ev', kind: 'home' },
    { id: 'city-hospital', slot: '2:2:0', title: 'Şehir Hastanesi', kind: 'hospital' },
  ]);

  const citizens = Object.freeze([
    { id: 'citizen-elif', name: 'Elif', disposition: 'friendly', x: -34.75, z: -21, yaw: Math.PI, cashDrop: 18, dialogue: 'Merhaba! Dondurmacı köşedeki sokakta, iyi günler.' },
    { id: 'citizen-ali', name: 'Ali', disposition: 'neutral', x: -49.25, z: 21, yaw: 0, cashDrop: 24, dialogue: 'Şehir bugün epey hareketli.' },
    { id: 'citizen-deniz', name: 'Deniz', disposition: 'friendly', x: -7.25, z: -21, yaw: Math.PI / 2, cashDrop: 32, dialogue: 'Kaldırımlardan gitmek daha rahat.' },
    { id: 'citizen-mert', name: 'Mert', disposition: 'neutral', x: 7.25, z: 21, yaw: -Math.PI / 2, cashDrop: 26, dialogue: 'Ben sadece yoluma bakıyorum.' },
    { id: 'citizen-kabadayi-1', name: 'Sokak kabadayısı', disposition: 'aggressive', x: 34.75, z: -21, yaw: Math.PI, cashDrop: 48, dialogue: 'Burada ne işin var? Uzak dur.' },
    { id: 'citizen-kabadayi-2', name: 'Huysuz mahalleli', disposition: 'aggressive', x: 49.25, z: 21, yaw: 0, cashDrop: 55, dialogue: 'Bana bulaşma, kendi işine bak.' },
    { id: 'citizen-irem', name: 'İrem', disposition: 'friendly', x: -21, z: 7.25, yaw: 0, cashDrop: 22, dialogue: 'Hastane yakındaki ara sokakta. Kendine dikkat et.' },
    { id: 'citizen-kaan', name: 'Kaan', disposition: 'neutral', x: 21, z: -7.25, yaw: Math.PI, cashDrop: 29, dialogue: 'Yeni açılan dükkânları gördün mü?' },
  ]);

  const hospitalSlot = getBuildingSlot('2:2:0');
  const hospitalSpawn = Object.freeze({
    x: hospitalSlot.x + Math.sin(hospitalSlot.face) * (hospitalSlot.depth / 2 - 1.8),
    y: 0,
    z: hospitalSlot.z + Math.cos(hospitalSlot.face) * (hospitalSlot.depth / 2 - 1.8),
  });

  return Object.freeze({
    roadLines,
    roadWidth,
    getBuildingSlot,
    items,
    shops,
    buildings,
    citizens,
    hospitalSpawn,
    bagCapacity: 12,
    npcHealth: 2,
    npcRespawnMs: 90_000,
    cashMin: 0,
    cashMax: 999_999,
  });
});
