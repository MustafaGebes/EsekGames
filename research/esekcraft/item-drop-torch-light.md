# EsekCraft1 eşya drop, araç modeli ve meşale ışığı güncellemesi

**Tarih:** 4 Ekim 2026

## Araştırma

- [Three.js Voxel Geometry](https://threejs.org/manual/en/voxel-geometry.html): voxel bloklarını tek birleşik mesh olarak üretirken özel nesneleri ayrı model olarak sahneye ekleme yaklaşımı incelendi.
- [Three.js PointLight dokümantasyonu](https://threejs.org/docs/#api/en/lights/PointLight): lokal ışık için mesafe ve şiddet kontrollü `PointLight` kullanımı temel alındı.
- [Three.js Object3D dokümantasyonu](https://threejs.org/docs/#api/en/core/Object3D): meşale ve kazma gibi çok parçalı modelleri `Group` içinde tutma yaklaşımı uygulandı.

## Uygulama

1. Blok kırılınca drop, kırılan bloğun içindeki merkez yerine önce aşağıdaki, sonra hedef yüz ve yanlardaki ilk boş hücreye yerleşiyor. Bu, aşağıda kırılan blokların item’larının oyuncunun üstüne fırlamasını engelliyor.
2. Drop başlangıç dikey hızı düşürüldü; item’lar daha doğal biçimde boş hücreye düşüyor.
3. Meşale drop/eldeki model artık çubuk + konik alevden oluşan gerçek 3B model.
4. Kazma, balta, kürek ve kılıç drop’ları artık blok küpü yerine sap ve kafa parçalarından oluşan özel modeller.
5. Yerleştirilen meşaleler birleşik blok mesh’inden çıkarılıp ayrı model olarak çiziliyor; her meşaleye sıcak renkli, hafif titreşen `PointLight` bağlanıyor.
6. `npm run lint` ve `npm run build` başarılı.
