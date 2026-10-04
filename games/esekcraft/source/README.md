# EsekCraft1 — EsekGames sürümü

Bu klasör, `MustafaGebes/EsekCraft` deposundaki `EsekCraft1` projesinin EsekGames'e aktarılmış sürümüdür.

EsekGames üzerinde `/games/esekcraft/` adresinden servis edilir.

## Geliştirme ve derleme

```bash
cd games/esekcraft/source
npm install
npm run lint
npm run build
```

Vite, EsekGames Express sunucusunun servis ettiği `../dist` klasörüne `/games/esekcraft/` base yolu ile derler.
