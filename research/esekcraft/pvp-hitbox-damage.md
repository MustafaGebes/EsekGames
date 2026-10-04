# EsekCraft PvP hitbox ve hasar

**Tarih:** 4 Ekim 2026

## Araştırma kaynakları

- [Minecraft Wiki — Melee attack](https://minecraft.wiki/w/Melee_attack): oyuncu saldırı menzilinin yaklaşık 3 blok olduğu, saldırıların tam hasar için attack cooldown beklediği ve cooldown tamamlanmasının saldırı hızına bağlı olduğu açıklanıyor.
- [Minecraft Wiki — Hitbox](https://minecraft.wiki/w/Hitbox): hitbox’ların çarpışma ve hedefleme için kullanılan fiziksel sınırlar olduğu; Java oyuncu hitbox ölçülerinin yaklaşık 1.8 yükseklik ve 0.6 genişlik olduğu belirtiliyor.

## Uygulanan kararlar

- EsekCraft oyuncusu için server-authoritative dikey kapsül hitbox: yaklaşık 1.85 yükseklik, 0.42 yarıçap.
- Yakın dövüş erişimi: 3.1 blok + hedef gövde yarıçapı.
- Saldırı, oyuncunun bakış yönünde yaklaşık 0.28 dot eşiğiyle kabul ediliyor; böylece arkaya vurma ve uzaktan sahte hedefleme engelleniyor.
- Saldırı cooldown: 500 ms. Bu, Minecraft’taki tam hasar bekleme fikrinin basit ve okunabilir bir uyarlaması.
- Hasar ölçeği Minecraft’ın 20 HP ölçeğine alındı: yumruk 1.5 HP; alet türleri server tarafında sınırlı değerlerle doğrulanıyor.
- Server hedefi, menzili, yönü, oyuncunun canlı olup olmadığını ve aynı odada bulunmayı tekrar kontrol ediyor.
- Vurulan oyuncu kırmızı flash alıyor; saldıran oyuncunun eşeği kısa bir vuruş animasyonu oynatıyor.

## Envanter modeli

Envanter önizlemesindeki eşek, kamera +Z tarafından baktığı için `Math.PI` ile çevrildi; yüz ve burun artık kullanıcıya dönük.
