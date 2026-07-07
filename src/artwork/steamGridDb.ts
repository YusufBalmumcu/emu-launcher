import type { ArtworkProvider } from "./types";

/**
 * SteamGridDB sağlayıcısı — oyun kısayolları eklendiğinde oyun kapağı/logosu
 * çekmek için ileride kullanılacak. Gömülü konsol logolarıyla aynı
 * ArtworkProvider arayüzünü uygular; bu sayede resolveArtwork() çağıranlar
 * değişmeden çalışmaya devam eder.
 *
 * İstekler Rust backend üzerinden yapılmalı (CORS'u aşmak ve API anahtarını
 * frontend paketinden uzak tutmak için). Kullanıma hazır olunca:
 *   registerProvider(createSteamGridDbProvider(apiKey))
 */
export function createSteamGridDbProvider(apiKey: string): ArtworkProvider {
  return {
    id: "steamgriddb",
    supports: (kind) => kind === "game-cover" || kind === "game-logo",
    async resolve() {
      // TODO: Rust komutu üzerinden https://www.steamgriddb.com/api/v2
      //   1) GET /search/autocomplete/{query}  -> oyun id
      //   2) GET /grids/game/{id} (kapak) veya /logos/game/{id}
      // Authorization: Bearer <apiKey> ile. Sonuçları diskte önbelleğe al.
      void apiKey;
      return null;
    },
  };
}
