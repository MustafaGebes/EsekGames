# ⚽ Online Futbol

Tarayıcıda oynanan **gerçek zamanlı çok oyunculu 2D futbol** oyunu.
HTML + CSS + JavaScript (Canvas) istemci, Node.js + WebSocket sunucu, GitHub + Render ile tek tık deploy.

- 5'li format, iki takım, **botlarla otomatik tamamlanır** (tek başına da oynanır)
- Sunucu **otoriter**: konum istemcide değil sunucuda hesaplanır (hile yok)
- 30 Hz fizik, 20 Hz snapshot, yerel tahmin (prediction) + interpolasyon
- **Kamera topu takip eder** (arkadaş 2D futbol oyunlarındaki gibi), sol altta **mini harita** vardır
- 2 devre × 90 saniye, gol/ devre arası/ maç sonu akışı
- Sohbet, oyuncu listesi, ping göstergesi, mobil joystick desteği

---

## Kontroller

| Tuş | İşlev |
|---|---|
| `W A S D` / ok tuşları | Hareket |
| `Boşluk` | Şut |
| `Shift` | Koş (sprint) |
| `E` | Pas (en uygun arkadaşa) |

Mobilde ekranın sol altında joystick, sağ altında `ŞUT` / `PAS` düğmeleri çıkar.

## Oynanış

1. Tarayıcıda adresi aç.
2. **Takma ad** yaz, **Oda kodu** gir (boş bırakırsan yeni oda açılır) veya **Rastgele**'ye bas.
   Lobideki **Aktif odalar** listesinden açık bir odaya tıklayıp doğrudan katılabilirsin.
3. **Oyuna gir** → odaya katılırsın. Arkadaşın aynı oda kodunu girip aynı sayfada oynayabilir.

---

## Yerel çalıştırma

```bash
npm install
npm start          # http://localhost:3000
```

Testler:

```bash
npm run test                      # ağ protokolü testi (sunucu ayakta olmalı)
node test/game-test.mjs           # oyun mantığı testleri (sunucu gerekmez)
```

---

## Deploy (GitHub → Render)

### 1. GitHub'a gönder

**En kolay yol — hazır script:**

```powershell
.\deploy-push.ps1                          # yeni repo (online-futbol)
.\deploy-push.ps1 -Repo esekgames -Existing   # mevcut repo
```

Script testleri çalıştırır, `gh` ile repo'yu oluşturur (gh oturumluysa) ve push eder.
`gh` oturumun yoksa önce bir terminalde `gh auth login` çalıştır.

**Manuel:**

```bash
git init
git add .
git commit -m "Online futbol v1"
gh repo create online-futbol --public --source=. --push --description "Tarayıcıda oynanan online 2D futbol oyunu"
```

(`gh` kurulu değilse: <https://cli.github.com> — ya da GitHub'da boş repo açıp `git push`)

### 2. Render'da servis oluştur

- Dashboard → **New → Blueprint** → repo'yu seç → `render.yaml` otomatik okunur → **Apply**
- Region: **Frankfurt (eu-central)** → Türkiye'ye gecik en düşük
- Sonuç: `https://online-futbol.onrender.com`

İleri / Manuel kurulum istersen: **New → Web Service** →
Build Command `npm install`, Start Command `npm start`, Health Check Path `/health`, Plan **Free**.

### 3. Bilmen gereken sınırlar (ücretsiz plan)

| Konu | Davranış |
|---|---|
| Soğuk başlangıç | 15 dk hareketsizlikte servis kapanır, açılması ~1 dk. İlk bağlanma yavaş olabilir |
| Aktif maç | WebSocket mesajı geldiği sürece servis uyanık kalır (24 Şub 2026 değişikliği) |
| Kalıcı disk | **Yok** → maç durumu RAM'de; servis restart olursa odalar sıfırlanır |
| Aylık süre | 750 instance saati / workspace |
| Veritabanı | **Kullanılmıyor.** Render Postgres ücretsizde 30 gün sonra expire olduğu için tercih edilmedi |

---

## Proje yapısı

```
server/
  index.js    Express + ws, statik sunum, /health, /api/rooms, oyun döngüsü
  game.js     Oda (maç) mantığı: fizik, bot yapay zekası, fazlar, olaylar
  rooms.js    Oda yönetimi (kod üretme, temizleme)
  net.js      Gelen mesaj doğrulama ve temizleme
shared/
  constants.js  Saha, fizik ve maç sabitleri (sunucu + istemci ortak)
  movement.js   Oyuncu hareketi (sunucu + istemci aynı fonksiyonu kullanır → prediction tutarlı)
public/
  index.html, css/style.css
  js/main.js     Lobby → oyun akışı, oyun döngüsü
  js/net.js      WebSocket istemcisi, otomatik yeniden bağlanma, ping
  js/input.js    Klavye + dokunmatik joystick
  js/predict.js  Yerel tahmin ve düzeltme (reconciliation)
  js/render.js   Canvas çizimi, kamera (topu takip eder) + mini harita + interpolasyon
  js/hud.js      Skor, süre, oyuncu listesi, chat
test/
  game-test.mjs      Oyun mantığı testleri (12 test)
  protocol-test.mjs  Ağ protokolü testleri (7 test)
```

## Protokol (özet)

**Client → Server:** `join` · `input` · `chat` · `again` · `ping`
**Server → Client:** `welcome` · `snapshot` · `roster` · `event` · `chat` · `pong`

Fizik ve sabitler `shared/` altında olduğu için sunucu ile tarayıcı **her zaman aynı sayıları** kullanır.

## Lisans

MIT
