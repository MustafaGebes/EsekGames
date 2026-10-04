# EsekCraft1 açlık, can yenilenmesi, alet modelleri ve drop fiziği

**Tarih:** 4 Ekim 2026

## Araştırma kaynakları

- [Minecraft Wiki — Hunger](https://minecraft.wiki/w/Hunger): açlık seviyesinin 20 puan olması, 18 ve üzerindeyken doğal yenilenme, açlık 0 olduğunda 4 saniyede 1 HP açlık hasarı ve sprint kısıtı incelendi.
- [Minecraft Wiki — Food](https://minecraft.wiki/w/Food): yiyeceklerin açlık/saturation ilişkisi ve sağlık yenilenmesinin beslenmeye bağlanması incelendi.
- [Three.js Voxel Geometry](https://threejs.org/manual/en/voxel-geometry.html): voxel bloklarından ayrı, çok parçalı nesne modelleri üretme yaklaşımı temel alındı.

## Uygulanan ayarlar

- Blok/item drop’larının başlangıç dikey hızı `0.05` seviyesine düşürüldü; yukarı fırlama kaldırıldı. Yatay saçılma da azaltıldı.
- Kazma, balta, kürek ve kılıçların eldeki silüetleri büyütülüp malzeme renkleri ayrıştırıldı; başlık şekilleri ayrı tutuldu.
- HUD’a mevcut kalp ve açlık ikonlarının yanında okunabilir `CAN` ve `AÇLIK` doluluk barları eklendi.
- Açlık tüketimi: hareketsizken yavaş, yürürken orta, sprintte daha hızlı olacak şekilde dengelendi.
- Açlık 18 veya üzerindeyken oyuncu 4 saniyede 1 HP doğal iyileşiyor.
- Açlık düşünce eski yenilenme zamanlayıcısı sıfırlanıyor.
- Açlık 0’da 4 saniyede 1 HP hasar devam ediyor.
- Can eksikken açlık tam olsa bile yiyecek tüketilebiliyor.
