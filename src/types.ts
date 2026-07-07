export interface Emulator {
  id: string;
  name: string;
  exePath: string;
  /** Emüle edilen sistemin id'si (bkz. systems.ts). Boşsa bilinmiyor. */
  systemId?: string;
}
