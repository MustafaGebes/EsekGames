# Esek Simulator — geliştirme yol haritası

## Bu dalda
- Cep parklarına dört küçük çiçeklik eklendi. Çiçeklikler çarpışma ve şehir chunk görünürlüğüyle kaydediliyor.
- Bina türlerine özel dış cephe ve iç mekân uygulaması [BUILDING_REWORK.md](./BUILDING_REWORK.md) içinde belgelendi.
- Genişletilmiş dalda 16 şehir türü ve ek katalog türleri için siluet/oda farklılıkları eklendi; test dosyası tüm türleri kuruyor. Görsel/perf cihaz kontrolü PR sonrası bekliyor.

## 1. Şehir binaları
- Bina türlerini ve kapı yuvalarını kataloglayıp test sözleşmesi kur.
- Kafe, ev ve hastane prototipleri genişletildi; dış cephe ve iç oda düzenleri kalan türlere yayıldı.
- Tür kurulumu için otomatik regresyon testi eklendi; görsel yerleşim ve performans kontrolü sırada.
- Görsel varyasyonları sabit bina tohumundan üret; tüm oyuncular aynı şehri görsün.
- Çarpışma, kapı geçişi, chunk görünürlüğü ve mobil performansı yayın kapısı yap.

## 2. Dekorasyon ve oynanış
- Park çiçekliklerini düşük donanımlı telefonlarda performans açısından kontrol et.
- Kaldırımlara sınırlı sayıda bisiklet parkı, yön tabelası ve otobüs durağı ekle.
- Başlangıç görevi, etkileşim ipuçları ve görev/ödül akışını geliştir.
- PC ve mobil kontrollerini tutarlı tut; çok oyunculu ilerlemeyi sunucu durumuyla eşle.

## 3. Hata önleme ve yayın kontrolü
1. `npm test` ve değiştirilen JavaScript sözdizimi kontrollerini çalıştır.
2. Masaüstü ve mobilde dolaşma, çarpışma, içeri girme/çıkma ve etkileşimi dene.
3. Bina türü, kapı hizası, oda içi dolaşım ve mobil kare hızını incele.
4. PR testleri yeşil olmadan ana dala birleştirme.
