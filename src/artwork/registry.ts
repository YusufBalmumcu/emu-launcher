import { bundledSystemProvider } from "./bundledSystems";
import type { ArtworkProvider, ArtworkRequest } from "./types";

// Kayıtlı sağlayıcılar, sırayla denenir. Şimdilik yalnızca gömülü konsol
// logoları; ileride createSteamGridDbProvider(...) burada eklenecek.
const providers: ArtworkProvider[] = [bundledSystemProvider];

export function registerProvider(provider: ArtworkProvider): void {
  providers.push(provider);
}

/** Anında, çevrimdışı çözümleme — ilk gömülü eşleşmeyi döndürür. */
export function resolveArtworkSync(req: ArtworkRequest): string | null {
  for (const p of providers) {
    if (p.supports(req.kind) && p.resolveSync) {
      const url = p.resolveSync(req);
      if (url) return url;
    }
  }
  return null;
}

/** Tam çözümleme — önce gömülü (sync), sonra scraper'ları (async) dener. */
export async function resolveArtwork(req: ArtworkRequest): Promise<string | null> {
  for (const p of providers) {
    if (!p.supports(req.kind)) continue;
    const url = p.resolveSync?.(req) ?? (await p.resolve(req));
    if (url) return url;
  }
  return null;
}
