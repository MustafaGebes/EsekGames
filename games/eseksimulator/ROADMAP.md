# Esek Simulator — geliştirme yol haritası

## Bu dalda
- Cep parklarına dört küçük çiçeklik eklendi. Çiçeklikler çarpışma ve şehir chunk görünürlüğüyle kaydediliyor.
- Şehir binalarını türlerine göre yeniden tasarlama araştırması ve aşamalı planı: [BUILDING_REWORK.md](./BUILDING_REWORK.md).

## 1. Şehir binaları
- Önce tüm bina türlerini ve kapı yuvalarını kataloglayıp test sözleşmesi kur.
- Kafe, ev ve hastanede dış cephe ile iç mekânı birlikte prototiple.
- Türlere özgü çatı, cephe, giriş ve oda planlarını tamamla; kalan konut/kamu türlerine yay.
- Görsel varyasyonları sabit bina tohumundan üret; aynı sunucuda herkes aynı şehri görsün.
- Çarpışma, kapı geçişi, chunk görünürlüğü ve mobil performansı yayın kapısı yap.

## 2. Dekorasyon ve şehir okunabilirliği
- Park çiçekliklerini düşük donanımlı telefonlarda kare hızı ve görünürlük açısından kontrol et.
- Kaldırımlara az sayıda bisiklet parkı, yön tabelası ve otobüs durağı ekle; yaya ve araç yollarını açık tut.
- Meydan, alışveriş sokağı ve hizmet binaları için tutarlı küçük işaretler kullan.
- Dekor eklerken çarpışma ve başlangıç sokağının açıklığını doğrula.

## 3. Oynanış ve kullanım kolaylığı
- Yeni oyuncu için kısa bir başlangıç görevi ve sade kontrol ipuçları ekle.
- Dükkân, vatandaş ve hizmet binalarını görev zincirleriyle birbirine bağla.
- PC ve mobilde aynı anlamı koruyan kontroller, yakındaki hedefe göre harita ve etkileşim ipuçları kullan.
- Görev ilerlemesi, yeniden doğma ve eşya kullanımını sunucu durumuyla tutarlı tut.

## 4. Hata önleme ve yayın kontrolü
Her özellik dalında:
1. `npm test` ile şehir yerleşimi, bina yuvaları ve gece-gündüz testlerini çalıştır.
2. `node --check server.js` ve değiştirilen JavaScript modüllerini denetle.
3. Masaüstü ve mobilde başlangıç, dolaşma, çarpışma, içeri girme/çıkma ve etkileşimi kontrol et.
4. Mümkünse GitHub Actions testleri PR üzerinde yeşil olmadan ana dala birleştirme.
