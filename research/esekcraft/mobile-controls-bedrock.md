# EsekCraft mobil kontrolleri — Bedrock araştırması

## Kaynaklar

- Mojang/Minecraft.net, [Minecraft Controls — Touch controls](https://www.minecraft.net/en-us/article/minecraft-controls): mobilde sol altta hareket joypad'i, ekran sürüklemesiyle bakış, sağda zıpla/koş/eğil düğmeleri; ekrana dokunarak ve basılı tutarak blok kırma, eşyayı kullanma/yerleştirme ve nesneleri açma davranışı.
- Minecraft Wiki, [Controls — Bedrock Edition / Touch](https://minecraft.wiki/w/Controls#Touch): joystick + dokunarak etkileşim, joystick + nişangâhla etkileşim ve D-pad seçeneklerini belgeliyor. Joystick sürüklenerek hareket, ekranda başka yerde sürükleyerek bakış; ayrı zıplama, gizlenme ve koşma düğmeleri; dokunma kontrolleri özelleştirilebilir.

## EsekCraft uygulaması

Bedrock'ın joystick + nişangâh yaklaşımı seçildi: sol altta analog hareket kolu; oyun alanında sürükleme ile kamera; sağda basılı tutulan zıplama/koşma, aç-kapa eğilme, saldırı-blok kırma ve kullanma-yerleştirme düğmeleri. Üst sağda envanter ve duraklatma/menü erişimi var; menüler kapandığında mobil mod masaüstü pointer lock istemiyor. Saldırı ve kullanma hâlihazırda oyunun merkez nişangâhına/raycast'ine gider; böylece düğmeler mevcut kırma, saldırma, sandık açma ve blok yerleştirme kurallarını kullanır. Seçilen PC/Mobil kontrol biçimi tarayıcı yerel depolamasında saklanır.
