# EsekCraft Demo

Bu klasör, `MustafaGebes/EsekCraft` reposundan aktarılan React + Three.js kaynak projesidir. Oyun EsekGames içinde `/games/esekcraft/` adresinde servis edilir.

Kaynak: [github.com/MustafaGebes/EsekCraft](https://github.com/MustafaGebes/EsekCraft), aktarılan upstream commit `49f6f18bdca4ea136deee8c215b8b655e55c84d3`.

## Geliştirme ve derleme

```bash
cd games/esekcraft/source
npm install
npm run lint
npm run build
```

Vite, `../dist` klasörünü `/games/esekcraft/` base yolu için üretir. EsekGames Express sunucusu bu klasörü oyun adresinde servis eder. `dist` derlemesi canlı yayında kullanılmak üzere EsekGames deposunda tutulur; root Render servisi kaynak kodu derlemez.

Dünya kayıtları ve ayarlar tarayıcının `localStorage` alanında saklanır. Eski EsekCraft sürümüyle aynı kayıt anahtarları korunmuştur; yeni oyun eksik eski oyuncu alanları için varsayılan değerler kullanır.
