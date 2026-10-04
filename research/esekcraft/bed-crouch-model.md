# EsekCraft: yatak modeli ve alçak boşlukta eğilme araştırması

**Tarih:** 4 Ekim 2026

## Kaynaklar ve doğrulanan davranışlar

- [Bed — Minecraft Wiki](https://minecraft.wiki/w/Bed): yatak yerleşimi iki yatay blok hücresi gerektirir; baş/ayak uçları oyuncunun baktığı yöne göre belirlenir. Minecraft’taki işçilik şablonu üç eşleşen yün ve bunların altında üç tahta içerir.
- [Sneaking — Minecraft Wiki](https://minecraft.wiki/w/Sneaking): eğilme hitbox yüksekliğini normal 1.8 bloktan 1.5 bloğa düşürür.
- [How crawling came to Minecraft — Minecraft.net](https://www.minecraft.net/fi-fi/article/how-crawling-came-minecraft): daha alçak alanlardan geçme davranışının oyuncu hitbox’ını küçültmeye dayandığını anlatır.

## İlk kodlama kararları

- Tarif çıktısının envanter ikonu, eldeki 3B yatak ve dünyadaki blok görünümü aynı eşya olarak sunulmalı; yatak küp/tahta görünmemeli.
- Dünya modeli iki yatay hücreyi (ayak + baş) kapsamalı, baş ve ayak aynı yönle saklanmalı; yatak item’ı yalnızca boş iki hücre ve uygun tam blok desteği varsa yerleşmeli.
- Eğilme sırasında oyuncunun düşey çarpışma yüksekliği 1.5 blok olarak ele alınmalı; kamera yüksekliği de aynı pozla uyumlu olmalı.

## Tam kaynak incelemesinden ek bulgular

Minecraft Wiki’nin yatak yerleşimi bölümünde ayak parçasının hedeflenen hücreye, baş parçasının oyuncunun baktığı yönde daha uzağa yerleştiği açıklanıyor. Java Edition yatakları sağlam zemin desteği olmadan da yerleştirilebilir; Bedrock Edition desteği şart koşar. EsekCraft’te hedef iki hücre boş olmalı; oyun basit blok fizik modeli kullandığından destek kontrolü ayrıca netleştirilecek.

Minecraft Wiki, Shift basılıyken ya da 1.8’den alçak fakat en az 1.5 blokluk açıklığa girildiğinde oyuncunun zorunlu eğildiğini; hitbox’ın 1.5’e indiğini, göz seviyesinin 0.35 blok alçaldığını ve hareketin yavaşladığını belirtiyor. Mojang’ın resmi yazısı, hitbox/camera alçaltmasının slab altından geçişi mümkün kıldığını ve yeterli alan yoksa duruşun otomatik değişmesi gerektiğini açıklıyor.

## Seçilen uygulama ve kaynaklar

Minecraft Wiki’ye göre yatak iki hücre ister: oyuncunun tıkladığı hedef hücreye **ayak**, oyuncunun baktığı yönde ilerideki boş hücreye **baş** konur. Java Edition’da yeterli yer varsa zemin desteği şart değildir; Bedrock Edition’da yerleştirme desteği aranır. EsekCraft şu an PC/Java benzeri klavye kontrolleri kullandığından Java davranışı seçildi: aynı seviyede iki hücre boş olmalı; ayak ve baş ayrı state olarak kaydolur, iki state de aynı yatak item’ına düşer. Kaynak: [Minecraft Wiki — Bed / Placement](https://minecraft.wiki/w/Bed).

Tarif, aynı renkte **3 yün** ile herhangi türden **3 tahta** kullanarak bir yatak üretir; kaynak: [Minecraft Wiki — Bed](https://minecraft.wiki/w/Bed). Uygulamada item ikonuna kırmızı şilte, beyaz yastık ve ahşap ayaklar çizildi; yerdeki iki state aynı yatak görünümünün iki parçası olarak mesh’leniyor. Böylece tarif çıktısı, envanter, el modeli, düşen item ve dünyaya yerleşim tahta küpüne dönmüyor.

Dar geçitte Minecraft Wiki, ayakta 1.8 blok ve eğilmiş 1.5 blok hitbox; gözün 0.35 blok alçalması; 1.5–1.8 blok açıklıkta zorunlu eğilme ve yaklaşık 1.3 blok/s eğilme hızı bildiriyor: [Minecraft Wiki — Sneaking](https://minecraft.wiki/w/Sneaking). Mojang’ın resmi geliştirici yazısı, düşürülen hitbox/kamera yüksekliğinin slab altından geçişi mümkün kıldığını doğruluyor: [How crawling came to Minecraft](https://www.minecraft.net/en-us/article/how-crawling-came-minecraft). EsekCraft’te Shift ile eğilme, 1.5 blok çarpışma yüksekliği, alçak boşluğa otomatik eğilme ve 1.27 göz yüksekliği eklendi. Koşu hızı 5.75’ten 6.0’a çıkarıldı (yaklaşık %4.3 artış); normal/yavaş yürüme hızları değiştirilmedi.
