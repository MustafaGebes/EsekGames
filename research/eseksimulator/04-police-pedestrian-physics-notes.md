# EsekSimulator: polis, yaya engel kaçışı ve araç çarpması

**Araştırma tarihi:** 4 Ekim 2026

Araştırmada üç ortak oyun geliştirme deseni kullanıldı. Birincisi, NPC kaçışında oyuncudan uzaklaşan yönün doğrudan duvarın içine girmesine izin vermemek; önce doğrudan yön, sonra iki yana kırılmış alternatif yön denemek. Projedeki şehir collider callback'i bu üç aday hareketi test ediyor. İkincisi, hızlı hareket eden araç ve mermi için tek karede hedefi atlamamak adına hareket boyunca küçük adımlarla temas/görüş kontrolü yapmak. Polis mermisi her karede ilerliyor ve bina collider'ına değdiğinde sahneden kaldırılıyor. Üçüncüsü, araç çarpmasında ragdoll/hit reaction ile AI durumunu ayırmak: insan kısa süre yerde kalıyor, canı sıfırsa görünmez oluyor; hayatta kalırsa önceki davranışına göre kaçmaya veya saldırmaya dönüyor.

Bu güncellemede hareketli yayalar ve dükkân görevlileri araç çarpışmalarına dahil edildi. Her temas sağlık azaltıyor; canı biten insan ölüyor, diğerleri yaklaşık 1.15 saniye sonra ayağa kalkıyor. Kaçan insan kaçış yönünü bina collider'larına göre seçiyor. Agresif insan ayağa kalkınca saldırı durumuna dönüyor.

Polis aracı artık hedefe daha düşük hızla yaklaşıp yaklaşık 1.35 metre mesafede duruyor; memurlar araç durduktan sonra görünür oluyor. Polisler 8.5 metreye kadar nişan alıyor, arada şehir binası varsa mermi duvara çarpıp yok oluyor. Sunucu tarafındaki polis hasarı da yaklaşık polis konumu ile oyuncu arasındaki bina görüş hattını kontrol ediyor; böylece duvar arkasından doğrudan hasar uygulanmıyor.

## Kaynaklar

- [Unity AI Navigation: About NavMesh Obstacles](https://docs.unity3d.com/Packages/com.unity.ai.navigation@2.0/manual/AboutObstacles.html)
- [Unity Discussion: NavMesh agent ragdoll recovery](https://discussions.unity.com/t/move-navmeshagent-avoidance-and-ragdolled-game-object/366116)
- [Epic Games: Ragdolling and how to recover from it](https://dev.epicgames.com/community/learning/tutorials/mvvL/unreal-engine-ragdolling-and-how-to-recover-from-it)
- [Godot: Third-person shooter bullet collision example](https://www.youtube.com/watch?v=d3AesLJwry0)
- [Little Polygon: AI with finite state machines](https://blog.littlepolygon.com/posts/fsm/)
