# EsekSimulator: şehir yaşamı, NPC, ekonomi ve varlık araştırması

**Araştırma tarihi:** 4 Ekim 2026  
**Kapsam:** düşük poligon karakter/araç yaklaşımı, NPC davranışları, dükkân içi ve şehir dokuları, lisans koşulları.

## Araştırma sonucu ve oyunda uygulanan seçim

Bu sürümde dışarıdan indirilen modelleri veya dokuları oyuna eklemedim. EsekSimulator’ın Three.js düşük poligon stilini ve mevcut yükleme boyutunu korumak için mevcut prosedürel insan/araç modelini genişlettim: mağaza görevlileri ve vatandaşlar, üniformalı polisler, polis otomobili/sirenleri ve iç mekân görevli noktaları kodla üretiliyor. Bu, model dosyası lisansı/atıf belirsizliğini ve gereksiz büyük texture paketini önlüyor.

Şehir sistemi sunucu doğrulamalı kurgulandı: başlangıç cüzdanı 0; dükkân mesafesi ve ürün fiyatı sunucuda kontrol ediliyor; envanter ve ekipman oyuncu kaydına kaydediliyor; vatandaş canı/ölümü/ganimeti, aranma yıldızları, polis hasarı, hastane ücreti ve yeniden doğma sunucu tarafından yürütülüyor. Oyuncu saldırınca 9 kalpli can ölçeğinde yaklaşık bir kalp hasar alıyor; aranma seviyesi zaman içinde düşebiliyor. Hastane tedavisi ücretli, ölümdeki kesinti mevcut şehir parasının %15’i (en az ₺1, en fazla eldeki bakiye).

NPC davranışları küçük durum-geçişleri yaklaşımına ayrılmıştır: günlük yaya/tezgâhtar, dostça etkileşim, saldırıya karşılık verme, saldırgan vatandaş, ölüm/yeniden oluşma; polis de çağrılma, otomobille yaklaşma, durma ve yaya müdahalesi evrelerinden geçer. Küçük şehir için bu, hata ayıklaması kolay FSM-benzeri bir çözüm; daha fazla görev, ilişkiler ve grup taktiği eklenirse davranış ağacına ya da hiyerarşik state machine’e ayırmak daha uygun olur.

## Modeller ve dokular için lisansı doğrulanmış kaynaklar

- **Kenney:** resmî destek sayfası, asset sayfalarındaki oyun varlıklarını CC0/public domain olarak tanımlıyor; ticari projelerde kullanıma izin verildiğini ve atfın zorunlu olmadığını söylüyor. İndirilen her paketin kendi lisans dosyası yine kontrol edilmeli. Özellikle şehir/araç prototipleri için 3D asset kataloğu incelenebilir. [Kenney Support](https://kenney.nl/support) · [3D Assets](https://kenney.nl/assets/category:3D)
- **ambientCG:** resmî lisans sayfası CC0 1.0 Universal’ı doğruluyor; dokular, modeller ve diğer dosyalar ticari kullanıma ve ham dosyaların oyun içine eklenmesine izin veriyor; atıf gerekli değil. Beton, kaldırım, asfalt, kumaş, metal ve iç mekân PBR malzemeleri için uygun aday kaynağı. [ambientCG License](https://docs.ambientcg.com/license/) · [ambientCG](https://ambientcg.com/)
- **Poly Haven:** resmî lisans sayfası kendi doku, model ve HDRI dosyaları için CC0 koşullarını ve atıf gerekmemesini açıklıyor. Mağaza/ev iç mekânı, çevresel ışık ve PBR yüzeyler için seçenek. [Poly Haven License](https://polyhaven.com/license)
- **OpenGameArt “3D Humanoids under CC0”:** varlık sayfasındaki bu paketin lisans ayrıntısı metin çıkarımında teyit edilemedi; bu nedenle bu paketi lisans onaylı saymadım ve oyuna almadım. [OpenGameArt package](https://opengameart.org/content/3d-humanoids-under-cc0)

## Sistem tasarımı kaynağı

Little Polygon’un FSM makalesi, durum makinelerinin anlaşılır ve hata ayıklaması kolay olduğunu; geçiş sayısı arttıkça bağlantı karmaşıklığının büyüyebileceğini ve daha büyük davranışlarda alt makineler/behavior tree seçeneklerinin düşünülebileceğini anlatıyor. Bu nedenle mevcut şehir kapsamı için açık ve küçük durumlar, sonraki büyük NPC görevleri için ise ayrı AI katmanları önerildi. [Tech Breakdown: AI with Finite State Machines](https://blog.littlepolygon.com/posts/fsm/)

## Lisans ve performans notu

Bu araştırma belirli bir paketi projeye aktarmak veya belirli bir dosyanın uyumluluğunu onaylamak anlamına gelmez; lisans her asset/paket sayfasında ve indirilen dosya içindeki license.txt ile ayrı kontrol edilmelidir. Bu teslimde dışarıdan indirilmiş asset yoktur; mevcut procedural geometri ve materyaller kullanılmıştır. İleride görsel kalite için ekleme yapılırsa, önce hedef malzeme/varlık seçilip düşük çözünürlüklü/uygun texture setiyle, Three.js draw-call ve mobil bellek etkisi ölçülerek eklenmesi önerilir.
