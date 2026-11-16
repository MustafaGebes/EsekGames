# Online Futbol Oyunu — Plan (HTML/CSS/JS + Node.js + GitHub + Render)

Hedef: Tarayıcıda açılan, **online** (gerçek zamanlı, çok oyunculu) 2D futbol oyunu.
Dağıtım: GitHub → Render Web Service → `https://<site>.onrender.com` üzerinden oynanır.

---

## 1. Kapsam kararı (ilk sürüm için)

| Konu | Karar | Gerekçe |
|---|---|---|
| Tür | 2D, top-down (Canvas) | HTML/JS ile 1-2 haftada oynanabilir; 3D (three.js) riski çok yüksek |
| Format | 5'li futbol (kale + 2 kaleci) | 11'li 3B yerine 5'li 2D en sağlam yol |
| Oyuncu sayısı | 2-10 gerçek oyuncu, eksik kadro **bot** ile tamamlanır | Tek oyuncu bile girip oynayabilsin |
| Oyun süresi | 2 x 90 sn devre + uzatma yok | Sunucu tarafı sayaç, hızlı test |
| Maç tipi | 1v1 / 2v2 / 5v5 (oda koduyla) | Lobby + oda yönetimi |
| Kimlik | İsim + emoji renk (hesap yok) | Login/auth yok, hızlı |

"Online" olmanın **zorunlu** şartı: gerçek zamanlı çok oyunculu → **sunucu tarafı权威 (authoritative) simülasyon** şart.
GitHub Pages sadece statik HTML barındırır, o yüzden WebSocket sunucusu için **Render Web Service** kullanılacak.

---

## 2. Teknoloji seçimi

```
[ Tarayıcı (Client) ]        [ Node.js Sunucu (Render) ]        [ GitHub ]
 HTML5 Canvas + JS      <--WS-->  Oda yöneticisi + fizik simülasyonu   Kod kaynağı
 (hareket/çizim)        <--WS-->  20 Hz snapshot yayını                (Render deploy
 (input gönderir)       <--WS-->  30 Hz oyun döngüsü                    tetikleyicisi)
```

- **Client:** HTML5 + CSS + vanilla JS (ES Modules). Framework yok (React/Vue gereksiz; canvas + socket için yalın JS daha temiz).
- **Server:** Node.js 20 + `express` (statik dosyalar + `/health`) + `ws` (WebSocket).
  - Alternatif: `socket.io` (reconnect/oda işi hazır gelir) — isterseniz v2'ye geçeriz.
- **Ortak kod:** `shared/constants.js` hem sunucu hem istemci tarafından import edilir (piksel sabitleri, fizik ayarları). Tek doğruluk kaynağı.
- **Paketler:** `express`, `ws`. Fazladan kütüphane yok.

---

## 3. Oyun mimarisi (detay)

### 3.1 Kim yetkili?
**Sunucu.** İstemci sadece "niyet" (input) gönderir, konum hesaplamaz. Aksi hâlde oyuncular hile yapar (speedhack/teleport).

### 3.2 Oyun döngüsü (sunucu)
```
her 33 ms (30 Hz):
  1) odadaki tüm oyuncuların input'unu topla
  2) fizik adımı: oyuncu hareketi, sürtünme, top fiziği, çarpışma, kale kontrolü
  3) olay üret (gol, kickoff, bitiş)
  4) 50 ms'de bir (20 Hz) snapshot'ı tüm istemcilere yayınla
```
Snapshot verisi küçük tutulur (oyuncu başına ~6 sayı). 10 oyunculu odada 20 Hz × ~600 byte ≈ 12 KB/s — sorun değil.

### 3.3 Ağ protokolü (JSON, WebSocket)

**Client → Server**
```json
{ "t": "join",    "name": "Mustik", "room": "ABC12" }
{ "t": "input",   "seq": 1042, "mx": 1, "my": 0, "sprint": true, "kick": true, "pass": false }
{ "t": "chat",    "msg": "gol!" }
{ "t": "again" }            // devre arası / yeniden başlat
```
`mx,my` = -1..1 arası normalleştirilmiş yön (klavye: WASD/oklar). `seq` = client frame sayacı (prediction için).

**Server → Client**
```json
{ "t": "welcome", "id": 7, "room": "ABC12", "tickRate": 30, "snapRate": 20 }
{ "t": "snapshot", "tick": 812, "time": 41.2,
  "players": [ { "id": 7, "x": 412, "y": 233, "vx": 2.1, "vy": 0.4, "team": 0, "anim": 3 } ],
  "ball":   { "x": 455, "y": 240, "vx": -3.0, "vy": 0.2 },
  "score":  [ 2, 1 ] }
{ "t": "event", "kind": "goal", "team": 0, "scorer": 7 }
{ "t": "chat", "from": "Mustik", "msg": "gol!" }
{ "t": "end", "score": [3,1] }
```

### 3.4 Gecikme (latency) yönetimi
- **Sunucu yetkili** → istemci kendi karakterini **prediction** ile hemen hareket ettirir, gelen snapshot'ta düzeltir (reconciliation).
- Uzak oyuncular için **interpolation**: 100 ms gecikmeli snapshot tamponu, iki snapshot arası yumuşatılmış çizim.
- Ping'i WS üzerinden ölç, HUD'da göster.

### 3.5 Fizik (basit ama hissi iyi)
- Saha 900×600 birim, oyuncu yarıçapı 14, top yarıçapı 8.
- Oyuncu: ivme tabanlı hız (max ~180 u/s), sprint ×1.35, hafif sürtünme.
- Top: vuruşta 250-420 u/s impuls, zemin sürtünmesi 0.985/tick, duvar sekmesi, kaleci eli yakalama.
- Çarpışma: oyuncu-top dairesel itme; oyuncu-oyuncu hafif ayrışma.

---

## 4. Dosya yapısı

```
online-futbol/
├─ package.json           # "type":"module", scripts: start, dev
├─ render.yaml            # Render Blueprint (tek tık deploy)
├─ .gitignore
├─ README.md              # oyuncular için + deploy notları
├─ server/
│  ├─ index.js            # express + ws + statik + /health
│  ├─ rooms.js            # oda (lobby) yönetimi, oyuncu/bot üretimi
│  ├─ game.js             # oyun döngüsü, fizik, olaylar
│  └─ net.js              # mesaj parse/serialize doğrulaması
├─ shared/
│  └─ constants.js        # pitch, hız, tick, sabitler (ortak)
└─ public/
   ├─ index.html          # lobby + oyun ekranı, HUD
   ├─ css/style.css
   └─ js/
      ├─ main.js          # bootstrap, ekran geçişleri
      ├─ net.js           # WS bağlantısı + reconnect (exponential backoff)
      ├─ input.js         # klavye/touch → input paketi
      ├─ predict.js       # yerel prediction + reconciliation
      ├─ render.js        # canvas çizimi, sabit kamera (tüm saha ekranda), interpolasyon
      └─ hud.js          # skor, süre, ping, oyuncu listesi
```

---

## 5. Aşamalar (milestone) + kabul kriteri

| # | Aşama | İçerik | Bitti nasıl anlaşılır |
|---|---|---|---|
| **M0** | İskelet | Repo, `package.json`, `express` statik sunum, `/health`, `render.yaml` | `npm start` → `http://localhost:3000` açılıyor |
| **M1** | Offline prototip | Canvas saha, 2 oyuncu (birisi bot), top fiziği, gol, skor | Tarayıcıda **tek başına** oynanabiliyor, his iyi |
| **M2** | Ağ omurgası | `ws` sunucu, oda kodu, join/leave, isim listesi | İki sekme aynı odaya girip birbirini görüyor |
| **M3** | Sunucu otoritesi | Fizik sunucuya taşınır, input gönderimi, 30 Hz sim, 20 Hz snapshot | Sekmeler birebir aynı simülasyonu görüyor (desync yok) |
| **M4** | Gecikme | Prediction + interpolation + ping göstergesi | 80 ms ping'de oyuncu titremiyor |
| **M5** | Maç akışı | Devre, kickoff, gol animasyonu/efekti, final, "tekrar oyna" | 2 devre + final doğru işliyor |
| **M6** | Deploy | GitHub push, Render Blueprint, soğuk başlangıç ekranı, hata durumları | `onrender.com` adresinden iki cihazla oynanıyor |

**M1'i atlamayın.** Gecikme yüzünden oyuncu hissi test edilmeden ağ katmanına geçmek, en sık yapılan hatadır.

---

## 6. GitHub + Render deploy adımı

### 6.1 GitHub
```bash
cd online-futbol
git init
git add .
git commit -m "ilk surum"
gh repo create online-futbol --public --source=. --push     # gh CLI ile
# veya GitHub'da boş repo aç → remote ekle → git push -u origin main
```

### 6.2 Render (Blueprint ile tek tık)
`render.yaml`:
```yaml
services:
  - type: web
    name: online-futbol
    runtime: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /health
    autoDeploy: true
```
Adımlar:
1. Render Dashboard → **New → Blueprint** → repo'yu seç → `render.yaml` otomatik okunur → Apply.
2. Bölge (region) seç: **Frankfurt (eu-central)** → Türkiye'ye gecik en düşük.
3. Deploy bitince `https://online-futbol.onrender.com` adresi hazır.

### 6.3 GitHub Pages neden değil?
Pages **sadece statik** dosya sunar; WebSocket sunucusu çalıştıramaz. Oyun istemcisi Pages'te, sunucu Render'da olabilir ama o zaman iki ayrı yer + CORS + soğuk başlangıç yoksa iki yer de gerekli → **tek yerde (Render) hem statik hem WS** en temiz çözüm.

---

## 7. Ücretsiz katmanın gerçek sınırları (bugünün hali)

| Konu | Gerçek | Etki / çözüm |
|---|---|---|
| WebSocket desteği | Var, süre limiti yok | Online oyun için uygun |
| Soğuk başlangıç | 15 dk hareketsizlikte servis **kapanır**, açılması ~1 dk | İstemcide "Sunucu uyanıyor..." ekranı + 2 sn aralıkla retry |
| 24 Şub 2026 değişikliği | WebSocket mesajı geldiği sürece servis **uyan kalır** | Maç sırasında kapanma riski düşük |
| Aylık süre | 750 instance saati/workspace | ~1 servis ay boyu yeterli |
| Bellek | 512 MB | Oda başına 10 oyuncu + bot: sorun yok |
| Kalıcı disk | **Yok** (free) | Maç durumu RAM'de; restart olursa odalar sıfırlanır (kabul edilebilir) |
| Postgres | **30 gün sonra expire**, 1 GB | **Kullanmayın.** Skor tablosu için Render Postgres yerine **GitHub Actions + JSON** veya ileride Supabase |
| Yatay ölçekleme | Tek instance | Oda sayısı sınırlı (RAM'e bağlı) |

Kaynaklar: [render.com/docs/free](https://render.com/docs/free), [Render changelog — WS ile uyanma](https://render.com/changelog/free-web-services-now-remain-active-while-receiving-websocket-messages), [Render Node hosting](https://render.com/hosting/nodejs)

---

## 8. Test planı

1. **Tek makine:** iki sekme (biri "Ev sahibi", biri "Misafir") → farklı oda kodları.
2. **Aynı Wi-Fi:** telefondan `http://<bilgisayarın-lan-ip>:3000` → mobil kontrol (dokunmatik joystick) testi.
3. **Gecikme:** Render'da iki farklı ağ (Wi-Fi + mobil veri) → 60-120 ms → titreme kontrolü.
4. **Soğuk başlangıç:** 20 dk bekle → ilk bağlanma ~1 dk sürmeli, istemci bunu göstermeli.
5. **Kayıp bağlantı:** Wi-Fi kes → istemci "bağlantı koptu" göstermeli, otomatik reconnect denemeli, 60 sn sonra "oyuncu ayrıldı" işlenmeli.

---

## 9. Riskler ve karşı önlemler

| Risk | Karşı önlem |
|---|---|
| Free servis gece/boşta kapanır | Retry + "uyanıyor" ekranı; ilk açılışta kullanıcıya bilgi ver |
| JSON bandwidth pahalı | 20 Hz snapshot, delta gönderimi sonraki sürüm |
| Oyuncu hilesi (teleport) | Sunucu otoritesi; input clamp + hız limiti doğrula |
| Chat spam / XSS | Metin uzunluk sınırı, HTML kaçışı, mesaj boyutu limiti |
| Sekme kapatılınca oyuncu kalır | Heartbeat (ping/pong) 15 sn; timeout'ta oyuncu çıkarılır |
| Node sürüm uyuşmazlığı | `package.json` içinde `"engines": {"node": "20.x"}` |

---

## 10. Zaman tahmini (tek kişi, günde 3-4 saat)

| Aşama | Tahmini |
|---|---|
| M0 İskelet | 1 saat |
| M1 Offline prototip | 5 saat |
| M2 Ağ omurgası | 3 saat |
| M3 Sunucu otoritesi | 6 saat |
| M4 Gecikme | 3 saat |
| M5 Maç akışı | 3 saat |
| M6 Deploy + test | 2 saat |
| **Toplam** | **~23 saat ≈ 1 hafta (yarı zamanlı)** |

---

## 11. V2'ye bırakılanlar (şimdi yapma)
- İki takım için farklı renk/kıyafet, oyuncu isimleri
- Skill sistemi (şut gücü, sprint, kalecilik) — sunucu tarafı sayaç
- Skor tablosu (Render Postgres yerine **Supabase** free tier veya KV)
- Sese/emoji emote, maç tekrarı (replay) kaydı
- Özel sunucu/oda şifresi, moderatör kontrolleri
- Mobil için tam ekran joystick + "pas ver" butonu
