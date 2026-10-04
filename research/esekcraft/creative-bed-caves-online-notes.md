# EsekCraft: creative, online admin, yatak ve derin dünya güncellemesi

**Tarih:** 4 Ekim 2026

## Araştırma kaynakları

- [Minecraft Wiki — Creative](https://minecraft.wiki/w/Creative): Creative modda uçuş, görünür can/açlık barlarının kaldırılması ve hasar bağışıklığı.
- [Minecraft Wiki — Creative inventory](https://minecraft.wiki/w/Creative_inventory): Tüm blok/eşyaların sınırsız seçilebildiği yaratıcı envanter yaklaşımı.
- [Minecraft Wiki — Bed](https://minecraft.wiki/w/Bed): Gece yatakta uyuma ve zamanın sabaha ilerlemesi.
- [Minecraft Wiki — Ore](https://minecraft.wiki/w/Ore): Cevherlerin Y seviyelerine göre dağılımı; derin bölgelerde elmas/altın, orta katmanlarda demir, daha üstte kömür yaklaşımı.

## Uygulama kararları

- Creative modda HUD can ve açlık göstergeleri gizlenir; değerler maksimumda tutulur ve oyuncu hasar almaz.
- E tuşuyla açılan envanterde Creative mod için sınırsız blok paleti eklendi.
- TAB basılı tutulduğunda online oyuncu listesi açılır; oyuncular `[ADMIN]` veya `[ÜYE]` olarak görünür. Oda sahibi admini odadan oyuncu atabilir. Host adı oda içinde korunur; host ayrıldıktan sonra oda adminsiz kalır, aynı adla geri girerse adminlik geri gelir.
- Yatak bloğu eklendi; gece sağ tıklanınca gün doğumuna geçer ve koordinatlar XYZ olarak HUD’da görünür.
- Dünya yüksekliği 48’den 64 katmana çıkarıldı. Cevher dağılımı Y seviyesine göre yeniden ayarlandı ve yeraltında deterministik tünel/oda mağaraları oyuldu.

Bu oyun içi prototipte mağaralar performans için düşük maliyetli deterministik sinüs gürültüsüyle oluşturulur; Minecraft’ın tam 3B gürültü motorunun birebir kopyası değildir.
