# Esek Simulator — Ara sokak ve cephe yenilemesi

**Tarih:** 14 Ekim 2026  
**Kapsam:** Şehirdeki tüm ara sokakların yaya koridorları, başlangıç sokağı, bina renkleri, vitrin ayrıntıları ve sokak aydınlatması.

## Araştırmadan çıkan ilkeler

- [NACTO — Green Alley](https://nacto.org/publication/urban-street-design-guide/streets/green-alley/): Ara sokaklar yaya öncelikli veya paylaşımlı mekân olarak açıkça okunmalı; dayanıklı, geçirgen/yüksek yansıtıcılı döşeme ve suyu kenarlarda yöneten çözümler kullanılmalı. Aydınlatma yaya ölçeğinde, zemine odaklı ve ışık kirliliğini sınırlayan biçimde olmalı.
- [City of Spokane — Innovation Alleys Toolkit (PDF)](https://static.spokanecity.org/documents/projects/innovation-alleyways/innovation-alleys-toolkit-2020-03-03.pdf): İnce ışık dizileri, yumuşak duvar aydınlatması, taşınabilir saksılar ve küçük oturma/yerleştirme öğeleri ara sokakları daha davetkâr kılar; bunlar geçişi ve erişimi engellememeli. Araç setindeki üst aydınlatma örneği için verilen 14 ft asgari yükseklik, oyunda daha yüksek bir hat tercih edilmesine dayanak oldu.
- [NACTO — Sidewalk Design](https://nacto.org/publication/urban-street-design-guide/street-design-elements/sidewalks/sidewalk-design/): Vitrinler ve cepheler yaya göz hizasında ilgi sunmalı; tente, oturma ve yaya ölçekli ışık kullanılmalı; sabit eşyalar engelsiz geçiş hattının içine taşmamalı.
- [Main Street Alabama — Downtown Design Guide (PDF)](https://www.mainstreetalabama.org/pdf/Main-Street-Alabama-Design-Guide.pdf): Cephelerde uyumlu, doğal/muted ana ton; sınırlı sayıda trim ve tente vurgusu öneriliyor. Daha canlı tonlar tabela ve tente gibi küçük vurgularda tutulmalı.
- [Fairfax County — Urban Design Guidelines, Chapter 4 (PDF)](https://www.fcrevite.org/sites/default/files/Assets/Documents/Urban-Design-Guidelines/Volume1-UDG-Chapter4-Sept21-2018-AC_A-1a.pdf): Uzun ve düz cepheleri pencere ritmi, malzeme değişimi, saçak/kornij ve küçük çıkmalarla insan ölçeğinde bölmek; yükseklikleri çeşitlendirmek sokak algısını iyileştiriyor.

## Oyuna uygulanan tasarım

- **Daha geniş ve düzgün koridor:** Başlangıç sokağı 5,7 m; konut adası ara sokakları 5,2 m; dükkân–apartman arasındaki karma kullanım geçişleri yaklaşık 5,1 m olarak ayarlandı. Binalar sokak eksenlerine paralel hizalı kalıyor; karma geçişlerde parsel derinliği de koridoru daraltmayacak biçimde azaltıldı.
- **Daha insani başlangıç sokağı:** Doğma sokağındaki bina derinliği 6,6 m ile sınırlandı; cephe yükseklikleri 10–11,5 m aralığına indirildi. Böylece daha geniş bir açıklık, gökyüzü ve okunaklı dükkân cephesi elde ediliyor.
- **Zemin ve yön bulma:** Tüm ara sokaklara tekrar eden taş örgüsü dokusu eklendi. Ortadaki açık renk yürüyüş şeridi ve kenar bordürleri sokağın yönünü vurguluyor; çöp veya başka eşya yürüme hattına taşınmıyor.
- **Aydınlatma:** Başlangıç sokağındaki kafes gibi enine çubuklar kaldırıldı. Yerine yaklaşık 5,48 m yükseklikte, yürüyüş doğrultusuna paralel iki ince sıcak ışık hattı ve cephe hizasında gece çalışan ışık kaynakları kullanıldı.
- **Küçük dokunuşlar:** Vitrin altı çiçeklikler, küçük çiçekler, renk uyumlu çizgili tente saçakları ve koridorun kenarında kalan alçak saksılar eklendi. Orta geçiş hattı en az yaklaşık 4,5 m açık kalıyor.
- **Renk dili:** Şehir genelindeki cephe paleti daha belirgin ama doğal tonlara taşındı: kiremit, bal/oker, adaçayı, mavi-yeşil, krem ve taş. Her binada gövde ana renk; koyu trim; sınırlı tente/tabela vurgusu kullanılıyor. Dükkânların tente ve vurgu renkleri birbirinden ayrışıyor fakat mahalle paletiyle uyumlu.

## Doğrulama

- `npm test`: **11/11 geçti**; bina çakışmaları, açık sokak koridorları, dükkân cephe yönleri, doğma alanı ve mevcut şehir işlevleri doğrulandı.
- `city-data.js` ve `enterable-buildings.js` sözdizimi kontrol edildi; `index.html` içindeki modül kodu `node --check` ile doğrulandı.
- Geçici tarayıcı önizlemesinde başlangıç sokağı açıldı; taş örgüsü, orta yürüyüş şeridi, farklı cephe renkleri ve yeni ışık düzeni görsel olarak kontrol edildi.
