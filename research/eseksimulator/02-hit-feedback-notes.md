# EsekSimulator: hit feedback ve saldırı okunabilirliği

**Araştırma tarihi:** 4 Ekim 2026

## Araştırma sonucu

Oyun geliştirme örneklerinde hasar anını oyuncuya anlatmak için kısa süreli renk flash'ı, yönlü hit reaction ve animasyonun ana temas anını belirginleştirme birlikte kullanılıyor. Flash'ın kalıcı renk değişimi yapmaması için temel materyal rengi saklanıp süre bitince geri yüklenmesi tercih ediliyor.

Three.js tarafında karakterler ayrı mesh/material parçalarından oluştuğu için her karakterin materyali klonlandı; böylece bir NPC'nin kırmızı yanması diğer insanları etkilemiyor. Hasar mesajı geldiğinde flash yaklaşık 0.28 saniye sürüyor ve orijinal renk otomatik geri yükleniyor.

Mevcut saldırı animasyonu yalnızca küçük bir bacak hareketi verdiği için okunurluğu düşüktü. Yeni animasyonda öndeki bacak daha belirgin öne tekmeleniyor, gövde saldırıya doğru eğiliyor ve baş/omurga hareketi darbeyi destekliyor. Bu, tek karelik hit yerine net bir hazırlık–temas–geri dönüş hissi veriyor.

## Uygulanan düzeltmeler

- İnsan hitbox yarıçapı `0.78 → 0.95` yapıldı.
- Eşek saldırı menzili `5.0 m` olarak istemci ve sunucuda eşitlendi.
- Çok dar ön açı kontrolü gevşetildi; yan/çapraz duran hedefler de vurulabilir hale geldi.
- Saldırılan NPC kısa süre **kırmızı yanıp eski rengine dönüyor**.
- Oyuncu hasar aldığında (NPC, polis veya başka bir sistemden) eşek kısa süre **kırmızı yanıp eski rengine dönüyor**.
- Saldırı animasyonu daha belirgin tekme, gövde eğimi ve baş hareketiyle yenilendi.

## Kaynaklar

- [Unity Discussions: How to make enemy flash when hit?](https://discussions.unity.com/t/how-to-make-enemy-flash-when-hit/652518)
- [Epic Developer Community: Making an enemy flash red when hit](https://forums.unrealengine.com/t/making-an-enemy-flash-red-when-hit/558784)
- [Three.js examples: animation and blending](https://threejs.org/examples/)
- [Unity: Hit Reaction - Ragdoll System showcase](https://discussions.unity.com/t/hit-reaction-ragdoll-system/603102)
