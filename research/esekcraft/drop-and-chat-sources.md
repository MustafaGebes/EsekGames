# EsekCraft: atılan eşya ve sohbet araştırması

## Kaynaklar ve bulgular

- Mojang Support, [Hotkeys in Minecraft: Java Edition](https://help.minecraft.net/hc/en-us/articles/360059148111-Minecraft-Java-Edition-Hotkeys): `Q` eldeki eşyayı yere atar; çok oyunculu sohbet `T` ile açılır; `/` komutu sohbet alanında başlatır. `Esc` menüyü açar.
- Mojang, [Minecraft Controls](https://www.minecraft.net/en-us/article/minecraft-controls): mobilde hareket için sol alt joypad, parmak sürüklemesiyle bakış, sağ tarafta zıplama/koşma/eğilme ve dokunma ile blok/nesne etkileşimi; sohbet için ekrandaki konuşma balonu düğmesi ve yazıp gönderme akışı tarif edilir. Sohbet açıldığında hareket/bakış duraklatılır.
- Minecraft Wiki, [Item (entity)](https://minecraft.wiki/w/Item_(entity)): oyuncu Q ile eşya bırakabilir; Bedrock mobilde eşya hotbar yuvasına basılarak atılabilir. Yere düşen eşyanın normal alma gecikmesi 10 tick (0,5 saniye), oyuncunun fırlattığı eşyanın gecikmesi 40 tick (2 saniye) olarak verilir; oyuncu alma kutusu yatayda hitbox dışına 1 blok daha uzanır. Kaynak sabit bir “atış mesafesi” tanımlamıyor; bu yüzden EsekCraft'taki fırlatma mesafesi küçük ve ayarlanabilir bir fizik artışıyla iyileştirilecek, 2 saniyelik geri-alma önlemi korunacak.

## Uygulama yönü

- Atılan eşyayı bakış yönünde biraz daha uzağa çıkart; hız ve yatay başlangıç ofsetini birlikte ama ölçülü artır. Normal blok/kırma drop'larına dokunma, atıcı için mevcut 2 saniyelik alma gecikmesini koru.
- Mobil modda PC tuş/fare hareketlerini devre dışı bırak; sanal hareket çubuğu ve dokunmatik eylemler kullanılmaya devam etsin. T/PC sohbet ve mobil konuşma balonu aynı sohbet panelini açsın.
- Çevrimiçi odada sohbet mesajlarını sunucuda doğrula ve aynı EsekCraft odasına yayınla; çevrimdışı tek oyuncuda yerel sohbet akışı çalışsın. Mesaj boyunu kısalt, kontrol karakterlerini temizle ve HTML olarak yorumlama.

## EsekCraft'ta uygulanan ayarlar

- Oyuncunun elle attığı eşya artık yatayda 1,0 blok önden başlar (önce 0,8) ve 2,6 yerine 3,2 blok/s başlangıç hızıyla fırlatılır; bu, sabit bir Minecraft mesafesini taklit etme iddiası değil, mevcut fiziğe göre yaklaşık dörtte bir daha uzağa atan küçük bir ayardır. İki saniyelik oyuncu-alma gecikmesi korunur; doğal blok drop'ları değiştirilmez.
- Mobil modda dünya açılırken pointer lock istenmez; PC klavye/fare/wheel girdileri yok sayılır. Sola sanal joypad, sağda bakış/eylem kontrolleri, dokunarak hotbar seçimi ve tüm yığını atma düğmesi kullanılabilir.
- Çevrimiçi sohbet yalnız aynı EsekCraft odasındaki oyunculara gönderilir; sunucu kontrol karakterlerini temizler, metni 200 karakterle sınırlar ve hızlı mesajları kısıtlar. Çevrimdışı sohbette mesajlar yalnız yerel ekranda gösterilir.
