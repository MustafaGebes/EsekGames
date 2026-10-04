# EsekCraft blok kırma süreleri

**Tarih:** 4 Ekim 2026

## Araştırma

- [Minecraft Wiki — Breaking](https://minecraft.wiki/w/Breaking): doğru araçta sertlik × 30 tick, yanlış araçta sertlik × 100 tick yaklaşımı.
- [Minecraft Wiki — Calculators/Breaking speed](https://minecraft.wiki/w/Calculators/Breaking_speed): araç hızı / sertlik üzerinden kırma hızı.
- [Minecraft Wiki — Log](https://minecraft.wiki/w/Log): odun kütüklerinde baltanın doğru araç olduğu, ancak elle kırmanın da mümkün olduğu davranış.

## Uygulama

Motor artık 20 tick/saniye ölçeğine çevrilmiş Minecraft-benzeri zaman kullanıyor:

- Doğru araç veya doğal olarak elle kırılabilen blok: `hardness × 1.5 / toolSpeed` saniye.
- Yanlış araç veya uygun olmayan el kırması: `hardness × 5 / toolSpeed` saniye.
- Meşe kütüğü: elle yaklaşık 3 saniye, tahta balta ile yaklaşık 1.5 saniye.
- Toprak: elle yaklaşık 0.75 saniye.
- Taş: elle yaklaşık 7.5 saniye ve taş kazmayla yaklaşık 0.56 saniye.
- Yün: elle yaklaşık 1.2 saniye.

Odun, tahta, sandık, çalışma masası ve yatak elle kırılabilir ve doğru blok drop’unu korur; taş/maden gibi bloklarda yanlış araç kullanıldığında kırma yavaşlar ve drop kuralları korunur.
