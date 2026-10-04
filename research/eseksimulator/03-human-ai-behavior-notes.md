# EsekSimulator: tüm insanlar, kaçış ve saldırı davranışı

**Araştırma tarihi:** 4 Ekim 2026

NPC davranışı için incelenen güncel oyun geliştirme örneklerinde devriye, kaçış ve saldırı davranışlarının küçük ve anlaşılır durumlara ayrılması öneriliyor. Little Polygon'un FSM yazısı, durumların ve geçişlerin açık tutulmasının hata ayıklamayı kolaylaştırdığını; davranış büyüdükçe alt durum makineleri veya behavior tree yapılarının tercih edilebileceğini belirtiyor. Unity'nin flee/NavMesh örneklerinde de oyuncudan uzaklaşan yönün hesaplanması ve geçici panik durumunun süreyle sınırlandırılması yaygın desen.

Bu sürümde şehirdeki insan listesi yalnızca sunucu vatandaşlarıyla sınırlı bırakılmadı. Hareketli yayalar, dükkân görevlileri ve vatandaşlar ortak `getNearestHuman` hedef havuzuna alındı. Böylece eşek yakınındaki her görünür insanı hedefleyebiliyor. Sunucuya kayıtlı vatandaşlarda gerçek sağlık/hasar doğrulaması korunuyor; yalnızca istemcide üretilen yayalar ve görevliler de aynı görsel hit tepkisini veriyor.

İnsanların davranışları basit durumlarla ayrıldı: `flee` hedefi vurulunca yaklaşık 3.8 saniye oyuncudan uzaklaşır; `attack` hedefi oyuncuya döner ve saldırı pozuna geçer. Vatandaşların saldırı hasarı sunucu tarafındaki mevcut agresif NPC sistemiyle devam eder. Bu yaklaşım küçük şehir haritasında anlaşılır ve düşük maliyetli kalırken ileride daha kapsamlı görev/AI sistemi için genişletilebilir.

## Kaynaklar

- [Little Polygon: Tech Breakdown - AI with Finite State Machines](https://blog.littlepolygon.com/posts/fsm/)
- [Unity: NPC movement / navigation / AI discussion](https://discussions.unity.com/t/npc-movement-navigation-ai/827301)
- [Unity Tutorial: NavMesh AI - NPC flee from enemy](https://www.youtube.com/watch?v=Zjlg9F3FRJs)
- [Unreal Engine community: AI fleeing behavior](https://forums.unrealengine.com/t/how-to-make-ai-run-away-from-player-with-blueprint/682764)
