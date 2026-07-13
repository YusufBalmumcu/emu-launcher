export interface Emulator {
  id: string;
  name: string;
  exePath: string;
  /** Emüle edilen sistemin id'si (bkz. systems.ts). Boşsa bilinmiyor. */
  systemId?: string;
  /** Özel grup id'si (yalnızca "custom" düzende kullanılır). Boşsa gruplanmamış. */
  groupId?: string;
}

export interface CustomGroup {
  id: string;
  name: string;
}

/** Ana ekran düzeni: düz liste, markaya göre, ya da özel gruplar. */
export type GroupingMode = "flat" | "brand" | "custom";

export interface AppSettings {
  grouping: GroupingMode;
  /** true ise elle sürüklenen sıra korunur; false ise varsayılan (marka→yıl) sıra uygulanır. */
  manualSort: boolean;
}

export interface AppState {
  emulators: Emulator[];
  groups: CustomGroup[];
  settings: AppSettings;
}
