# EsekCraft: üst yarım basamak ve açılır kapı araştırması

**Tarih:** 4 Ekim 2026

## Minecraft davranışı

- [Slab — Minecraft Wiki](https://minecraft.wiki/w/Slab): slab alt/üst yarımda bulunabilir. Bloğun alt yüzüne veya yan yüzün üst yarısına yerleştirmek üst slab; bloğun üstüne veya yan yüzün alt yarısına yerleştirmek alt slab oluşturur. Aynı tür üst ve alt slab tek blok hücresinde birleşerek tam blok olur.
- [Door — Minecraft Wiki](https://minecraft.wiki/w/Door): kapı alt ve üst olmak üzere iki blok hücresini kaplar; alt parça hedeflenen yere konur ve üst parça bir blok üstte oluşur. Altta tam, katı bir destek ve üstte boş yer gerekir.
- [Wooden Door — Minecraft Wiki](https://minecraft.wiki/w/Wooden_Door): ahşap kapı redstone olmadan oyuncu etkileşimiyle açılıp kapanır. Kapı durumunda yön (facing), üst/alt yarı (half), menteşe (hinge) ve açık/kapalı (open) bilgileri bulunur.

## Görsel/doku yaklaşımı

Minecraft Wiki’deki oak door görselleri, üst-alt parçada devam eden kahverengi ahşap panel, çerçeve ve küçük pencere ayrıntıları için referans alındı. Oyunun atlası mevcut usulüyle procedural/piksel çizimli olarak üretilecek; yeni dünya kapı tile’ları ayrı üst/alt yüzey dokusu kullanacak. Böylece oyuncunun elindeki kapı ikonu ile dünyadaki iki parçalı kapı aynı meşe/piksel stilini koruyacak.

## Kodlama kararları

- Üst slab, ayrı bir blok durumu olarak saklanmalı; yerleştirme yan yüz çarpma yüksekliğine ve bloğun alt yüzüne göre alt/üst yarıyı seçmeli.
- Kapı tek küp değil, iki blok yüksekliğinde ince, dokulu panel olmalı. Sağ tık iki yarıyı birlikte açıp kapatmalı; üst/alt ve yön bilgisi kayıtta da korunmalı.

## EsekCraft uygulaması

- Üst slab ayrı blok durumu olarak kaydedilir. Yan yüzün orta çizgisinin üstüne veya blok alt yüzüne tıklanınca üst slab; alt çizginin altına veya blok üst yüzüne tıklanınca alt slab koyulur. Aynı tür alt slab üst yüzünden, üst slab alt yüzünden tıklanırsa tam bloğa birleşir.
- Meşe kapı alt+üst hücre, dört yön ve açık/kapalı durumuyla saklanır. İki parçanın procedural piksel dokuları ayrı atlas tile’larıdır; world modeli ince panel olarak döner. Oyuncu sağ tıklayarak açıp kapatır; iki yarı aynı anda güncellenir, kapıyı kırmak ikisini birlikte kaldırır.
- Eski kayıtlarda üst tarafı başka bir blokla dolu tek hücrelik kapı varsa toggle o bloğu ezmez.

## Doğrulama

- `npm run lint` ve `npm run build` başarılı.
- Küçük smoke test’i üst slab offset/height/base-id ile doğu yönünde açık üst kapı durumunu doğruladı.
- Sandbox önizlemesinde başlangıç menüsü yüklendi; browser console boş kaldı.
