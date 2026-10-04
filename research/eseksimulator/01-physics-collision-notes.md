# EsekSimulator: araç çarpışması, hitbox ve fizik güncellemesi

**Araştırma tarihi:** 4 Ekim 2026

## Araştırma özeti

- Three.js `Raycaster` ve genel çarpışma yaklaşımı, görsel mesh ile fiziksel temas şeklinin ayrı ele alınmasını destekler. Bu nedenle araçlar tek bir düz kutu yerine gövde, kabin, cam/çatı ve dört teker için ayrı yerel çarpışma parçalarıyla tanımlandı.
- MDN 3D collision detection rehberi, pratik oyun çarpışmalarında basit sınırlayıcı hacimlerin (AABB/sınır kutusu gibi) performanslı başlangıç noktası olduğunu anlatır. EsekSimulator'ın düşük poligon ve mobil hedefi için araç parça collider'ları döndürülmüş yerel kutuların dünya eksenindeki sınırlarıyla test ediliyor.
- Unreal Engine'in Physical Animation yaklaşımı, darbe sonrası fiziksel tepkiyi animasyona karıştırma ve sonra kontrollü şekilde animasyona dönme fikrini kullanır. Buradaki hafif istemci fiziğinde eşek darbede yatıyor/savruluyor, hız sönümleniyor ve yaklaşık 1.22 saniyede ayağa dönüyor.
- Unity topluluk örnekleri ve araç-ragdoll tartışmalarındaki ortak desen: araç hareketini algılayan ön/temas bölgesi, darbeyi hızdan türetme ve karakteri ragdoll/hit-reaction durumuna geçirme. Bu projede aynı desen motor bağımlılığı olmadan Three.js gruplarıyla uygulandı.

## Uygulanan kararlar

1. Eşek dünya ölçeği 0.50'den 0.58'e çıkarıldı; şehirle orantı korunurken modelin gövde ve kulak detayları daha okunur hale geldi.
2. İnsan hedefleri için yaklaşık gövde hitbox'ı (`radius: 0.78`) eklendi. Vuruş artık sadece merkez mesafesine değil, 4.6 m menzil + eşeğin baktığı yöndeki açıya göre seçiliyor.
3. Sunucu aynı menzil ve yön kontrolünü tekrar yapıyor; istemci hedef seçimini taklit ederek hileli uzaktan/arkadan vuruşları reddediyor.
4. Araç gövdesi, kabini, çatısı ve tekerleri ayrı collision parçaları olarak tutuluyor. Araç hareketliyken temas eden eşeğe araç hızına bağlı yatay/dikey darbe veriliyor.
5. Darbe sonrası hareket girişi kısa süre kilitleniyor; model dönüyor, savruluyor ve sönümlenmiş hızla tekrar ayağa kalkıyor.
6. Mevcut bina/oda collider listesi korunarak şehirdeki kapı açıklıkları ve iç mekân mobilyalarının çarpışmaları bozulmadı.

## Kaynaklar

- [Three.js Raycaster](https://threejs.org/docs/#api/en/core/Raycaster)
- [MDN: 3D collision detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection)
- [Epic Games: Physics Driven Animation in Unreal Engine](https://dev.epicgames.com/documentation/en-us/unreal-engine/physics-driven-animation-in-unreal-engine)
- [Unity Discussions: Hit Reaction - Ragdoll System](https://discussions.unity.com/t/hit-reaction-ragdoll-system/603102)
- [Epic Developer Community: Vehicle ragdoll collision](https://forums.unrealengine.com/t/vehicle-ragdoll-collision/295090)
