# EsekCraft1 cevher drop ve model düzeltmesi

**Tarih:** 4 Ekim 2026

## Araştırma

- [Three.js — Voxel (Minecraft Like) Geometry](https://threejs.org/manual/en/voxel-geometry.html): voxel dünyalarında blokların komşu yüzlerinin doğru üretilmesi ve raycast/picking akışının korunması yaklaşımı incelendi.
- [Minecraft Wiki — Ore](https://minecraft.wiki/w/Ore): cevherlerin kırıldığında kaynak veya ham malzeme düşürmesi ve araç seviyesi kuralları kontrol edildi. EsekCraft1’in demir/altın için ham malzeme düşürmesi bu modele uyuyor.

## Bulgu

Demir ve altın cevheri `RAW_IRON` / `RAW_GOLD` düşürüyordu; fakat bu iki `ItemType` atlasın item-tile kayıt tablosuna eklenmemişti. Bu nedenle yere düşen item mesh’i ve envanter ikonu için geçerli UV eşlemesi bulunmuyordu.

## Uygulama

1. `RAW_IRON` ve `RAW_GOLD` item-tile kayıtları eklendi.
2. Kömür, ham demir, ham altın, elmas ve külçe drop’ları için küçük fasetli `IcosahedronGeometry` modelleri oluşturuldu.
3. Diğer item drop’ları mevcut atlas tabanlı küp modeliyle çalışmaya devam ediyor.
4. `npm run lint` ve `npm run build` başarılı; `/games/esekcraft/` HTTP 200 ile doğrulandı.
