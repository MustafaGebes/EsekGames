# EsekCraft: fırın, araçlar, item fiziği ve mob etkileşimleri araştırması

**Tarih:** 4 Ekim 2026

## Kaynaklar ve kararlar

- [Minecraft Wiki — Smelting](https://minecraft.wiki/w/Smelting): Fırında input, fuel ve output yuvaları; ateş göstergesinin kalan yakıt süresini göstermesi; varsayılan işlem süresinin 10 saniye olması; yakıtın işleme başlamasında tüketilmesi. Oyunda mevcut tarifler korunup görsel yakıt göstergesi kalan `burnTimeRemaining / maxBurnTime` üzerinden güncellenecek.
- [Minecraft Wiki — Shears](https://minecraft.wiki/w/Shears): Makasla koyun kırkıldığında 1–3 yün düşmesi; koyunun çim yedikten sonra yününün geri gelmesi; yaprak ve benzeri bloklarda makasın özel davranışı. Prototipte koyun için 60 saniyelik yeniden yünlenme zamanlayıcısı kullanılacak.
- [Minecraft Wiki — Sand](https://minecraft.wiki/w/Sand): Desteksiz kumun düşen blok davranışı; oyuncunun başını kapatırsa sürekli boğulma hasarı alması. EsekCraft’ta düşen kum/geliştirilmiş item düşüşü aynı destek kontrolüne bağlanacak.
- [Minecraft Wiki — Chest](https://minecraft.wiki/w/Chest): Sandığın entity benzeri kapak modeli ve açılış/kapanış animasyonu. Mevcut GUI açılışına görsel tween ve dünya üzerindeki kapak dönüşü ekleme kararı alındı.
- [Minecraft Wiki — Tool](https://minecraft.wiki/w/Tool): Blokların uygun araçla daha hızlı kırılması ve bazı blokların doğru araç olmadan kaynak düşürmemesi. El ile taş/maden kırılmasını engellemek için harvest kontrolü tüm `requiredTool` türlerine genişletilecek.
- [Minecraft Wiki — Item (entity)](https://minecraft.wiki/w/Item_(entity)): Yere bırakılan eşyaların dünyada item entity olarak görünmesi. EsekCraft’taki mevcut özel item meshleri korunup drop impulse, destek ve pickup bekleme davranışı iyileştirilecek.

Bu tur çok sayıda sistemi aynı anda istediği için güvenli kapsam önceliği: fırın yakıt göstergesi ve tarif doğruluğu, doğru araç zorunluluğu, yiyecek/malzeme item modelleri, yün/makas ve yaprak drop davranışı, kum yerçekimi/boğulma, online GUI pause düzeltmesi ve tile-entity senkronizasyonu. Kapı/çit/slab/armor görsel modelleri ayrı bir genişletme olarak aynı procedural model altyapısına bağlanacak.
