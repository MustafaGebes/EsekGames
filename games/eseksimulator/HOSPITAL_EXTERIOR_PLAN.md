# Şehir Hastanesi — dış model ve iç yerleşim planı

## Amaç ve kapsam

Hastane dış görünüşünü belirginleştirip, kapıdan girildiğinde okunaklı ve dolaşılabilir bir iç plan sunmak. Bu revizyonun odağı tek bina: şehirdeki hastane ayak izi, kapı yuvası ve mevcut oyun etkileşimleri korunur. Brookhaven RP hastanesinin açık lobi, hasta alanı, yatak çevresi perdeleri, eczane ve tıbbi ekipman yaklaşımından esinlenilir; geometri, adlar ve içerik Esek Simulator için özgün olarak üretilir.

## Dış model

Açık taş/krem cephe, turkuaz hastane vurguları, geniş giriş saçağı ve kolonları, okunaklı `HASTANE` tabelası, kademeli merkez pavyonu ve iki çatı kanadı kullanılır. Çatı sağlık artısı pavyona oturur. Üst cephede beş sütun ve beş sıradan oluşan çerçeveli pencere düzeni vardır.

## İç mekânın yön ve dolaşım düzeni

Ana girişten içeri bakıldığında banko önde ve merkezde durur. Bankonun iki yanından açık dolaşım boşluğu kalır. Lobi tarafında her iki yanda ikişer tane olmak üzere dört bekleme koltuğu ve duvar kenarında bir tekerlekli sandalye bulunur. Sağ tarafta raflara dizilmiş küçük bir eczane bölümü, karşı yanında tekerlekli tıbbi malzeme arabası bulunur.

Bankonun arkasında merkez koridor uzanır; sağ ve solunda kapısız, 2,5 birim genişliğinde iki servis açıklığı vardır. Her açıklık iki yataklı bir hasta bölümüne geçer. Toplam dört yatak bulunur. Her yatağın çevresinde üç taraflı mahremiyet perdesi ve üst rayı vardır. Yataklarda şilte, yastık, örtü, baş/ayak paneli, yan korkuluk, IV askısı, yatak başı monitörü ve çağrı düğmesi bulunur. Yatakların yanına komodinler konur.

## Geometri ve çarpışma kuralları

- İç dekor, `hospital-interior` adıyla ayrı bir Three.js grubu olarak tutulur; dış kabuk gösterilmeden 3B kesit incelemesi yapılabilir.
- İki servis açıklığının her biri 2,5 birim genişliğindedir ve kapısızdır. Bölme duvarları açıklık sınırlarında kesilir.
- Yataklar, bekleme koltukları, tekerlekli sandalye, eczane rafı, malzeme arabası, banko ve bölme duvarları oyuncu çarpışmasına kaydedilir. Perde panelleri görseldir; geçiş kapatan collider eklenmez.
- Bankonun yanlarından ve lobi orta aksından geçiş korunur. Yataklar yan duvarlardan ve açıklıklardan uzak tutulur.
- Otomatik testler yatakların birbiriyle çakışmadığını, yatak alanlarının sınırlar içinde kaldığını, her yatakta monitör ve çağrı düğmesi bulunduğunu, perde panellerinin eklendiğini, bekleme mobilyalarının ve tekerlekli sandalyenin lobi sınırlarına sığdığını ve banko çevresindeki geçişin açık kaldığını doğrular.
- Ana giriş kapısının mevcut açılma animasyonu korunur; içteki iki servis açıklığına kapı eklenmez.

## Önizleme ve manuel kontrol

`HOSPITAL_INTERIOR_PREVIEW.html` model kodunu doğrudan yükleyen bir 3B inceleme sayfasıdır. Fareyle sürükleyerek döndürülebilir ve tekerlekle yakınlaştırılabilir. Kesit düğmesiyle iç yerleşim ve tam dış kabuk arasında geçiş yapılır; kesit modunda bölmeler alçaltılarak yatak ve mobilyalar görünür bırakılır.

Otomatik geometri kontrolleri oyunun içinden yapılan yürüme testinin yerine geçmez. Oyunda giriş kapısını açıp bankoya ulaşma, iki açıklıktan geçme, yatakların etrafında dolaşma, dışarı çıkma ve mobil kamera kontrolü ayrıca denenmelidir. Görselde beğenilmeyen yerleşimler kullanıcı incelemesine göre revize edilir.

## Kaynak ve test kaydı

- Brookhaven St. Lukes Hospital wiki sayfası lobi/resepsiyon, eczane, bekleme koltukları, perde kullanılan hasta yatakları ve diğer tedavi odalarını tarif eder. Kaynak sayfası topluluk tarafından güncellenir; plan birebir kopya değildir: https://brookhaven.fandom.com/wiki/St._Lukes_Hospital
- Brookhaven hastane yenileme turu bekleme alanı, eczane, hasta odaları, görüntüleme ve ameliyat alanları gibi oyun içi rol yapma ayrıntılarını gösterir: https://www.youtube.com/watch?v=Yy7IOKNTQNQ
- Son `npm test`: 12 test geçti, 0 başarısız; `node --check` ve `git diff --check` başarılı.
- 3B önizleme Chromium’da render edilir; iç mekân dış kabuk kesit görünümü ve fareyle döndürme/yakınlaştırma içerir.
- Oyunun kendisinde manuel yürüme/mobil cihaz testi henüz yapılmamıştır.
