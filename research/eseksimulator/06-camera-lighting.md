# Esek Simulator: kamera, doğma noktası ve sokak aydınlatması

**Tasarım notu — 14 Ekim 2026**

## Araştırma bulguları

Roblox'un klasik üçüncü şahıs kamerası karakteri takip eder; oyuncu kamerayı yatay ve dikey döndürebilir, yakınlaştırıp uzaklaştırabilir. Kamera karakteri bir engelin arkasında bıraktığında varsayılan “Zoom” davranışı kamerayı karaktere yaklaştırır; karakter yeniden görünür olunca kamera dışarı açılır. Roblox belgelerinde varsayılan görüş alanı 70 derecedir. [1]

Three.js `Raycaster`, bir ışını 3B nesnelere karşı sınayabilir ve en yakın kesişimleri mesafeye göre sıralar. Bu, engel arkasına giden kamera yolunda güvenli bir noktayı seçme yaklaşımını destekler. [2]

Three.js `PointLight` gerçek sahne nesnelerini bulunduğu noktadan aydınlatmak için uygundur. Şehirde her lambaya ayrı dinamik ışık koymak yerine, yakındaki birkaç lambayı takip eden küçük bir ışık havuzu performans maliyetini sınırlarken oyuncunun çevresini gece aydınlatır. [3]

## Uygulanan kararlar

- Oyuncu, yeri boş olan özel bir ara sokak bloğunda, zemin düzeyinde doğar. Blok içinden geçen yaya yolu ve iki yandaki yapı doğma yerini anlaşılır kılar.
- Meydanın veri koordinatı gerçek blok merkezine eşitlenir.
- Kamera klasik üçüncü şahıs takibi, orbit, dikey bakış ve tekerlekle yakınlaştırmayı korur. Görüş alanı 70° olur. Engel arkasında güvenli kamera noktası bulunamazsa kamera hedef mesafesi boyunca ikili aramayla en yakın görünür noktaya çekilir; yol açılınca mevcut yumuşak takip kamerayı tekrar dışarı taşır.
- Ekran/klavye kontrolleri değişmeden kalır. Yürüyüş yönüne dönme yumuşatılır ve ağdaki diğer oyunculara karakterin gerçek bakış açısı gönderilir.
- Sokak lambalarının ampulleri gün döngüsünde gündüz söner, gece parlar. Oyuncuya yakın sekiz lamba için gölgesiz, kısa menzilli sıcak renkli ışık havuzu kullanılır.

## Kaynaklar

[1]: https://create.roblox.com/docs/workspace/camera "Roblox Creator Hub, Customize the camera"
[2]: https://threejs.org/docs/pages/Raycaster.html "Three.js, Raycaster"
[3]: https://threejs.org/docs/pages/PointLight.html "Three.js, PointLight"
