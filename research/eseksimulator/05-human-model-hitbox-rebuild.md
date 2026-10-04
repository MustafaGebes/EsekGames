# EsekSimulator: insan modelinin ve hitbox sisteminin yeniden kurulması

**Araştırma tarihi:** 4 Ekim 2026

Önceki sistemde insan hedefleme sanal merkez mesafesi ve yön filtresine fazla bağlıydı. Melee hitbox/hurtbox örneklerinde önerilen yaklaşım, görsel mesh'ten bağımsız bir karakter hurtbox'ı kullanmak ve hedef seçimini tüm karakter koleksiyonunda ortak yapmaktır. Bu nedenle yeni modelde kafa, gövde, kollar ve bacaklar yuvarlatılmış capsule/sphere parçalarıyla yeniden oluşturuldu; hedefleme için ortak bir gövde capsule ölçüsü tutuluyor.

Yeni ortak hedef sorgusu vatandaş, yaya ve dükkân görevlisini aynı havuzda arıyor. Ön cephe açısı artık hedefi tamamen dışlamıyor; eşeğin saldırı menzili içinde kalan en yakın canlı insan seçiliyor. Böylece modelin yana dönük olması veya farklı mesh parçalarının merkezden uzak durması vuruşu engellemiyor.

Her insanın lokal canı bulunuyor. Vatandaşlar sunucu tarafı şehir canı ile eşleştiriliyor; yalnızca istemcide oluşturulan yayalar ve dükkân görevlileri de üç canlık lokal hasar alıyor. Hasar sonrası hit flash, `flee` veya `attack` AI durumuna geçişi kullanılıyor. Kaçan kişiler panik yönünde uzaklaşırken saldırganlar oyuncuya dönüyor.

## Kaynaklar

- [GameDev.tv: Capsule collider ile hitbox/damage](https://community.gamedev.tv/t/trigger-damage-with-hitboxes-and-collisions-with-the-player/215241)
- [Unity: Character Controller ve Capsule Collider](https://www.youtube.com/watch?v=0vitsRuj3Os)
- [Godot: Melee hitbox ve hurtbox yaklaşımı](https://www.youtube.com/watch?v=JWjzSn95bM0&vl=en)
- [Unity Discussions: Character Controller collision](https://discussions.unity.com/t/character-controller-and-collision/376183)
- [Little Polygon: AI finite state machine](https://blog.littlepolygon.com/posts/fsm/)
