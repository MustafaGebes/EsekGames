# ⚽ Online Futbol

Tarayıcıda oynanan **gerçek zamanlı çok oyunculu 2D futbol** oyunu.
HTML + CSS + JavaScript (Canvas) istemci, Node.js + WebSocket sunucu.

> **Canlı adres:** https://eskgame.onrender.com/games/futbol/
>
> **EsekGames içindeki yerleşim:** bu klasör EsekGames hub'ının bir parçasıdır.
> Oyun ana sitede **`/games/futbol/`** adresinde yayınlanır ve aynı Node sunucusu
> tarafından sunulur (`/games/futbol/ws` WebSocket kanalı).
> Ayrı bir Render servisi istiyorsan aşağıdaki "Tek başına deploy" bölümüne bak.

- 5'li format, iki takım, **botlarla otomatik tamamlanır** (tek başına da oynanır)
- Sunucu **otoriter**: konum istemcide değil sunucuda hesaplanır (hile yok)
- 30 Hz fizik, 20 Hz snapshot, yerel tahmin (prediction) + interpolasyon
- **Sabit kamera**: tüm saha tek ekranda görünür (kaydırma yok, Aniball tarzı), sahanın etrafında masa çerçevesi
- 2 devre × 90 saniye, gol/ devre arası/ maç sonu akışı
- Sohbet, oyuncu listesi, ping göstergesi, mobil joystick desteği

---

## EsekGames hub'ına bağlı nasıl çalışıyor

| Parça | Yeri |
|---|---|
| Oyun istemcisi (statik) | `games/futbol/public/` → `/games/futbol/` |
| Paylaşılan fizik sabitleri | `games/futbol/shared/` → `/games/futbol/shared/` |
| WebSocket oyun kanalı | `/games/futbol/ws` |
| Oda listesi API'si | `/games/futbol/api/rooms` |
| Sunucu modülü | `games/futbol/server/football.js` → `createFootball()` fabrikası |
| Kök sunucu bağlantısı | `server.js` → dinamik `import()` + `upgrade` delegasyonu |

Kök `server.js` CommonJS, oyun modülü ESM olduğu için modül çalışma anında
`import()` ile yüklenir; WebSocket `upgrade` istekleri `/games/futbol/ws` yoluna
yönlendirilir. Oyun klasörü kendi `package.json` dosyasında `"type": "module"`
bildirir, bu yüzden ESM dosyaları doğru yorumlanır.

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
npm run test                 # oyun mantığı testleri (12 test, sunucu gerekmez)
npm run test:protocol        # ağ protokolü testleri (7 test, sunucu ayakta olmalı)
```

> Test dosyaları `checks/` klasöründe durur; `test/` değil. Böylece EsekGames kökündeki
> `npm test` (yani `node --test`) oyun testlerini otomatik toplamaz ve sunucu
> gerektiren protokol testi derlemeyi bozmaz. Protokol testi sunucuya ulaşamazsa
> hata vermek yerine **SKIP** döner.

Hub üzerinden test:

```bash
BASE_URL=http://localhost:3100/games/futbol node checks/protocol-checks.mjs
```

---

## Deploy

### EsekGames ile birlikte (varsayılan — zaten aktif)

Oyun `games/futbol/` altında EsekGames reposunda duruyor ve kök `server.js` tarafından
sunuluyor. GitHub'a `main` branch'ine push yaptığında Render otomatik deploy eder;
kurulum gerektiren ek bir servis yok.

```powershell
git add .
git commit -m "Online Futbol guncellemesi"
git push origin main
```

Yerel deneme:

```powershell
cd D:\Projelerim\EsekGames
npm install
$env:PORT = 3100
node server.js      # ana site: http://localhost:3100  |  oyun: http://localhost:3100/games/futbol/
```

### Tek başına deploy (ayrı Render servisi istersen)

Oyun klasörü kendi sunucusunu da içerir (`server/standalone.js`), bu yüzden ayrı bir
Render servesi olarak da yayınlanabilir:

- Dashboard → **New → Web Service** → repo: `MustafaGebes/EsekGames`
- **Root Directory**: `games/futbol`
- Build Command `npm install`, Start Command `npm start`, Health Check Path `/health`
- Region: **Frankfurt (eu-central)**, Plan **Free**

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
  js/render.js   Canvas çizimi, sabit kamera (tüm saha ekranda) + interpolasyon
  js/hud.js      Skor, süre, oyuncu listesi, chat
checks/
  game-checks.mjs      Oyun mantığı testleri (12 test)
  protocol-checks.mjs  Ağ protokolü testleri (7 test, sunucu gerekir)
```

## Protokol (özet)

**Client → Server:** `join` · `input` · `chat` · `again` · `ping`
**Server → Client:** `welcome` · `snapshot` · `roster` · `event` · `chat` · `pong`

Fizik ve sabitler `shared/` altında olduğu için sunucu ile tarayıcı **her zaman aynı sayıları** kullanır.

## Lisans

MIT
