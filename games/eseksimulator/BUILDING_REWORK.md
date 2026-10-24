# Esek Simulator — şehir binalarını yeniden tasarlama planı

## Araştırma özeti

Şehir 10×10 bloktan oluşuyor; şehir verisi 233 bina ayak izi ve 16 bina türü üretiyor. Dış cepheler çoğunlukla ortak kutu taban, çatı, pencere ve saçak üreticisiyle kuruluyor; bazı türlere özel ekler var. Sahne üreticisi 233 ayak izinin tamamına giriş, oda kabuğu ve türe göre mobilya üretimi kuruyor. Bunun yanında 13 katalog kaydı ana dükkân ve hizmet binalarına özel kimlik verir. Dış cepheler ortak temel üreticiyi, bazı iç mekânlar da ortak aile yerleşimlerini paylaşıyor.

Hedef; bina türlerini ve oyun işlevlerini kataloglamak, sonra her aileye ayrı siluet, cephe ve iç mekân planı vermek. Şehir ölçeğinde tekrarlanan küçük parçaların draw call maliyetini sınırlamak için Three.js `InstancedMesh` öneriyor. Özel, tekil modeller için glTF/GLB uygun bir aktarım biçimi. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) · [Three.js model yükleme rehberi](https://threejs.org/manual/pages/loading-3d-models.html) · [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)

## Bu daldaki ilk uygulama dilimi
- Kafe cephesi çizgili tente ve dış menü panosuyla ayrışıyor; içeride espresso makinesi ve vitrinli tatlı tezgâhı var.
- Ev girişine saçak/porch eklendi. Townhouse içi kitaplıkla; avlulu ev içi bitkiyle farklılaşıyor.
- Hastaneye giriş saçağı/kolonları eklendi; içeride hasta monitörleri ve bekleme oturma alanı var.
- Kapı animasyonu, mobilya çarpışmaları ve bu üç prototipin model parçalarını kontrol eden test eklendi.

## Tasarım ilkeleri

- Her yapı türünün ayrı silueti, çatı biçimi, giriş yeri ve cephe dili olsun.
- Aynı türdeki örnekler sabit bina tohumundan küçük, kararlı varyasyonlar alsın; kopya hissi azalsın ve tüm oyuncular aynı şehri görsün.
- İç mekânlar işleve uysun: mağazada ürün rafı/tezgâh, evde oda mobilyası, hastanede kayıt/bekleme/tedavi, itfaiyede araç bölmesi/ekipman.
- Her binanın iç yerleşim verisi olsun. Mevcut 233 giriş/kapı akışı korunmalı; 13 özel katalog kaydının dükkân ve hizmet işlevleri kaybolmamalı.
- Kapı, collider, şehir chunk görünürlüğü, çok oyunculu etkileşim ve lobi akışları korunmalı.
- GTA'dan model, doku, tabela veya marka alınmamalı; Esek Simulator'a özgü şehir dili ve Türkçe işaretler kullanılmalı.
- Önce hafif procedural Three.js modelleri kullanılsın. GLB yalnızca tekil landmark veya elle üretilmiş özel model gerçekten değer kattığında eklensin.

## Bina aileleri ve görsel hedef

| Aile | Dış görünüş | İç mekân |
|---|---|---|
| Sıra ev / kasaba evi | Dar cephe, giriş saçağı, ayrı çatı ve pencere ritimleri | Salon, mutfak, yatak odası; eve göre döşeme ve mobilya |
| Apartman / avlulu ev | Balkon, ortak giriş, çatı deposu veya avlu | Giriş holü, koridor ve örnek daire |
| Mahalle dükkânı | Tente, vitrin, ürün tabelası ve ayrı renk paleti | Bakkal, market, kıyafet, alet, dondurma ve kafe için ayrı raf/tezgâh/oturma |
| Hastane / klinik / veteriner | Geniş giriş, hizmet işareti, farklı cam ve çatı kütlesi | Resepsiyon, bekleme ve tedavi alanı |
| Polis / itfaiye / hapishane | Araç kapısı, arma/şerit, kule veya güvenlik çiti | Karşılama, ekipman, hücre veya araç garajı |
| Okul / kütüphane / toplum merkezi | Kurumsal giriş ve ortak kullanım cephesi | Sınıf sıraları, okuma masaları/raflar veya toplantı düzeni |
| Diğer şehir türleri | Her tanımlı tür için ayrı çatı, giriş ve landmark öğesi | Türün oyun işlevine göre oda ve engel düzeni |

Tablo başlangıç sınıflandırmasıdır. Kodda bulunan tüm `kind` değerleri taranmalı; hiçbir tür genel varsayılan görünüme düşmemeli.

## Uygulama aşamaları

### 0. Başlangıç ölçümü ve güvenli geçiş
- `city-data.js`, `index.html`, `enterable-buildings.js` ve şehir etkileşimlerini başlangıç noktası olarak kaydet.
- Bina kimliği, yuvası, ölçüsü, kapı yönü, collider ve katalog eşleşmesi için testleri genişlet.
- Masaüstü ve mobilde başlangıç sokağı, meydan ve açılabilir binalar için görsel referans al.

### 1. Bina tanım kataloğu
- Her türe `exteriorArchetype`, `interiorArchetype`, renk paleti, çatı/cephe stili ve kapı yönü veren açık bir katalog oluştur.
- Şehirdeki her türün tek bir tanıma bağlandığını, kapı yuvalarının katalogla eşleştiğini test et.
- Görsel varyasyonu küresel `Math.random` yerine bina `seed` değerinden üret.

### 2. Dış cephe prototipleri
- Önce üç dikey örnek yap: mahalle dükkânı, ev ve kamu binası.
- Siluet, giriş/vitrin, malzeme paleti, ışık ve collider'ı birlikte tamamla.
- Kaldırım, yaya aralığı ve başlangıç sokağı testlerini koru.
- Prototiplerden sonra diğer bina ailelerine aynı katalog sözleşmesiyle geç.

### 3. İşleve uygun iç mekânlar
- Bina başına sabit oda planı tanımla: giriş, dolaşım, mobilya ve collider noktaları aynı veriden üretilsin.
- 16 bina türünün oda planlarını ayrılaştır; 13 katalog kimliği olan özel dükkân ve hizmet binalarının işlevini koru. Ev, kafe, market, bakkal, kıyafetçi, aletçi, dondurmacı, polis, itfaiye, hastane ve hapishane kendi düzenini alsın.
- Kapı aç/kapat, içeri geçiş, kamera sınırı ve oda içi çarpışmaları her türde kontrol et.
- İç mekânları yalnızca yaklaşıldığında veya kapı açıldığında etkinleştiren stratejilerle sahne maliyetini sınırla.

### 4. Tüm şehir örneklerine yayma
- Aynı türün cephe varyasyonlarını sabit `seed` ile belirle.
- Tüm bina türlerinin iç yerleşim verisini tanımla; görev ve hizmet etkileşimlerini kademeli olarak her türe yay.
- Landmark yapıları özel modüler parçalarla tamamla; tekrar eden pencere, çit ve küçük süsleri toplu çiz.

### 5. Yayın ve regresyon kapısı
- `npm test`, katalog/ayak izi/kapı testleri ve JavaScript sözdizimi kontrolleri yeşil olmalı.
- Her bina türü için sahne denetimi: üst üste binme, kapı hizası, oda dolaşımı ve çarpışma.
- Masaüstü ve telefonda başlangıç, dolaşma, içeri girme/çıkma ve yeniden bağlanmayı dene.
- Düşük donanımda başlangıç yüklemesi, görünür draw call sayısı ve kare hızını ölç; gerekirse ayrıntı ve ışık sayısını azalt veya tekrar eden parçaları örneklemeli çiz.

## Tamamlanma ölçütleri

- Her şehir bina türünün kararlı kimliği, ayrı dış cephe tarifi ve işlevine uygun iç yerleşim tanımı var.
- 233 binanın geçiş/collider akışı çalışıyor ve 13 özel katalog kimliği korunuyor.
- Yeniden yüklemede bina şekli ve varyasyonu aynı kalıyor.
- Yerleşim testleri ve mobil performans kontrolleri geçiyor.

## İlk önerilen sıra

1. Tür envanteri ve katalog/test sözleşmesi.
2. Kafe, ev ve hastaneyi dış cephe + iç mekân olarak prototiple.
3. Diğer açılabilir yapıları ayrı iç planlara taşı.
4. Kalan konut, eğitim, kültür ve servis türlerine benzersiz cephe ve iç yerleşim ver.
5. Bina türlerine göre görev ve etkileşim içeriğini kademeli ekle.
