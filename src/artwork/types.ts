// Genel görsel (artwork) sağlayıcı arayüzü.
// Şu an sadece gömülü konsol logoları için kullanılıyor; ileride oyun
// kısayolları eklendiğinde SteamGridDB gibi scraper'lar aynı arayüzü
// uygulayarak oyun kapağı/logosu sağlayacak — çağıran kod değişmeyecek.

export type ArtworkKind = "system-icon" | "game-cover" | "game-logo";

export interface ArtworkRequest {
  kind: ArtworkKind;
  /** system-icon için: sistem id'si (bkz. systems.ts). */
  systemId?: string;
  /** game-* için: aranacak oyun başlığı. */
  query?: string;
}

export interface ArtworkProvider {
  readonly id: string;
  supports(kind: ArtworkKind): boolean;
  /** Hızlı, çevrimdışı çözümleme (gömülü varlıklar). Opsiyonel. */
  resolveSync?(req: ArtworkRequest): string | null;
  /** Asenkron çözümleme (ağ üzerinden scraper'lar). */
  resolve(req: ArtworkRequest): Promise<string | null>;
}
