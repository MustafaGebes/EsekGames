# Esek Simulator — geliştirme yol haritası

## Bu dalda
- Cep parklarına dört küçük çiçeklik eklendi. Renkler mahalle paletiyle uyumlu; çiçeklikler yol çizgilerinin dışında kalıyor, çarpışma alanı ve şehir chunk görünürlüğüyle kaydediliyor.
- Mevcut görsel dili koru: sıcak taş, ahşap, yeşil alan ve sade şehir tabelaları.

## 1. Dekorasyon ve şehir okunabilirliği
- Park çiçekliklerini düşük donanımlı telefonlarda kare hızı ve görünürlük açısından kontrol et.
- Kaldırımlara az sayıda bisiklet parkı, yön tabelası ve otobüs durağı ekle; yaya ve araç yollarını açık tut.
- Meydan, alışveriş sokağı ve hizmet binaları için farklı ama tutarlı küçük görsel işaretler kullan.
- Dekor eklerken çarpışma, chunk görünürlüğü ve başlangıç sokağının açıklığını doğrula.

## 2. Oynanış
- Yeni oyuncu için kısa bir başlangıç görevi ve ekranda sade kontrol ipuçları ekle.
- Şehirdeki dükkân, vatandaş ve hizmet binalarını küçük görev zincirleriyle birbirine bağla.
- Ödül ve ekonomi akışını görev süresi, harcanan para ve tekrar oynama isteğiyle dengele.
- Çok oyunculu durumda görev ilerlemesi, yeniden doğma ve eşya kullanımını sunucu durumuyla tutarlı tut.

## 3. Düzen ve kullanım kolaylığı
- Kontrolleri PC ve mobilde aynı anlamı koruyacak şekilde grupla.
- Harita ve etkileşim ipuçlarını yakındaki hedefe göre göster; ekranda gereksiz HUD kalabalığı oluşturma.
- Menü, duraklatma ve lobi akışlarını klavye, dokunmatik ve dar ekranlarda gözden geçir.
- Kod değişikliklerini küçük parçalara ayır; şehir verisi, görsel üretim ve oynanış mantığını ayrı tut.

## 4. Hata önleme ve yayın kontrolü
Her özellik dalında:
1. `npm test` ile şehir yerleşimi, bina yuvaları ve gece-gündüz testlerini çalıştır.
2. `node --check server.js` ve değiştirilen JavaScript modüllerini denetle.
3. Tarayıcıda masaüstü ve mobil görünümde başlangıç, dolaşma, çarpışma, etkileşim ve yeniden bağlanmayı elle kontrol et.
4. Mümkünse GitHub Actions'ta testleri PR üzerinde çalıştır; test sonucu yeşil olmadan ana dala birleştirme.

## Öncelik sırası
1. Cep parkı dekorasyonu ve performans kontrolü.
2. Başlangıç görevi ve daha anlaşılır etkileşim ipuçları.
3. Görev/ödül dengesi ve çok oyunculu kenar durumları.
4. Kaldırım dekorları, erişilebilirlik ve yayın öncesi regresyon kontrolü.
