# EsekCraft: elde tutulan her eşya için ayrı model

**Tarih:** 4 Ekim 2026

## Araştırma ve görsel kararlar

- [Minecraft Wiki — Tutorial: Models](https://minecraft.wiki/w/Tutorial:Models): Blok modelleri ile elde/başta/dünyada gösterilen item modellerinin ayrı görsel roller olduğunu açıklıyor. EsekCraft'ta blok eşyaları atlas dokulu minyatür blok olarak kalırken blok olmayan item'lar kategoriye özgü geometriyle oluşturuluyor.
- [Three.js — Group](https://threejs.org/docs/pages/Group.html): Birden fazla mesh'i tek nesne hiyerarşisinde birlikte dönüştürmek ve elde tek model gibi taşımak için `THREE.Group` kullanımı.
- [Three.js — Making Voxel Geometry](https://threejs.org/manual/en/voxel-geometry.html): Büyük voxel dünya geometrisini birleştirme/performans yaklaşımı; eldeki tekil görsel nesnelerin dünya chunk mesh'inden ayrı tutulması.

## Uygulama kapsamı

`source/src/game/engine.ts` içindeki `updateHeldItemModel()` seçili eşyanın her değişiminde ayrı bir 3B görsel oluşturur:

- Araçlar: kazma, balta, kürek ve kılıç geometrileri; tahta/taş/demir/elmas malzemeleri farklı renklerle gösterilir.
- Bloklar: ilgili atlas dokusunu kullanan minyatür blok modeli; meşale kendi çubuk/alev modeliyle, meşe kapı ise çerçeveli ince kapı modeliyle gösterilir.
- Malzemeler: kömür/odun kömürü, demir/altın külçe, ham demir/altın ve çakmak taşı birbirinden ayrı şekil ve renkler alır.
- Yiyecekler: ekmek, elma ve sekiz çiğ/pişmiş et türü ayrı biçim/renk detaylarına sahiptir.
- Diğerleri: deri, tüy, yün, makas ve her zırh parçası kendi siluetini taşır.

Model parçaları `THREE.Group` altında birleştirilerek elde birlikte konumlandırılır. Blok dünyasının birleştirilmiş mesh akışına dokunulmaz.

## Kontrol

- `npm run lint` — başarılı.
- `npm run build` — başarılı. Önceden var olan Vite `__dirname` ve büyük JS chunk uyarıları dışında hata yok.
