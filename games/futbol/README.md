# ⚽ Online Futbol

Tarayıcıda oynanan **gerçek zamanlı çok oyunculu 2D futbol** oyunu.
HTML + CSS + JavaScript (Canvas) istemci, Node.js + WebSocket sunucu, GitHub + Render ile tek tık deploy.

> **EsekGames üzerinde canlı:** https://esekgame.onrender.com/games/futbol/
> (EsekGames hub'ının içine gömülü; kaynak kod `games/futbol/` klasöründe)

- 1v1 – 5v5 formatı, iki takım, **botlarla otomatik tamamlanır** (tek başına da oynanır)
- Sunucu **otoriter**: konum istemcide değil sunucuda hesaplanır (hile yok)
- 30 Hz fizik, 20 Hz snapshot, yerel tahmin (prediction) + interpolasyon
- **Sabit kamera**: tüm saha tek ekranda görünür (kaydırma yok, Aniball tarzı), sahanın etrafında masa çerçevesi
- Tek devre 90 saniye: süre bitince **önde olan kazanır**, beraberlikte **altın gol** oynanır
- **Depar** (Shift), **ifadeler** (1-6), **8 karakter** seçimi, takım avatar şeritleri, gol atanlar tablosu
- Kamera: uzak (tüm saha) / yakın (oyuncu takipli) geçişi
- Sohbet, oyuncu listesi, ping göstergesi, mobil joystick desteği

---

## Kontroller

| Tuş | İşlev |
|---|---|
| `W A S D` / ok tuşları | Hareket |
| `Boşluk` | Vur (şut) |
| `Shift` / `C` | Depar (kayma, 2,5 sn bekleme) |
| `E` | Pas (en uygun arkadaşa) |
| `1` – `6` | İfade gönder (😂 🔥 💪 😭 😡 👋) |

Mobilde ekranın sol altında joystick, sağ altında `VUR` / `DEPAR` / `PAS` düğmeleri çıkar.

## Oynanış

1. Tarayıcıda adresi aç.
2. **Takma ad** yaz, **Maç modu** seç (1v1 – 5v5), **Karakter** seç, **Oda kodu** gir
   (boş bırakırsan yeni oda açılır) veya **Rastgele**'ye bas.
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
npm run test                 # oyun mantığı testleri (22 test, sunucu gerekmez)
npm run test:protocol        # ağ protokolü testleri (10 test, sunucu ayakta olmalı)
```

> Test dosyaları `checks/` klasöründe (Node'un `node --test` otomatik toplayıp
> sunucusuz ortamda kırılmaması için `test/` değil). Protokol testi sunucuya
> ulaşamazsa hata vermek yerine **SKIP** döner.

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
- Sonuç: `https://esekgame.onrender.com/games/futbol/` (oyun EsekGames hub'ının içinde yayınlanır)

> Not: Bu klasör EsekGames hub'ının `games/futbol/` parçasıdır; canlı adres
> `esekgame.onrender.com` üzerinden **hub sunucusu** tarafından sunulur.
> Ayrı bir servis istiyorsan aşağıdaki "Tek başına deploy" bölümüne bak.

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
  js/render.js   Canvas çizimi, sabit kamera (tüm saha ekranda) + interpolasyon
  js/hud.js      Skor, süre, oyuncu listesi, chat
checks/
  game-checks.mjs      Oyun mantığı testleri (22 test)
  protocol-checks.mjs  Ağ protokolü testleri (10 test, sunucu gerekir)
```

## Protokol (özet)

**Client → Server:** `join` · `input` · `emote` · `chat` · `again` · `ping`
**Server → Client:** `welcome` · `snapshot` · `roster` · `event` · `chat` · `pong`

Fizik ve sabitler `shared/` altında olduğu için sunucu ile tarayıcı **her zaman aynı sayıları** kullanır.

## Lisans

MIT
