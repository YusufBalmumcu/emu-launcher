import { BRAND_ORDER, brandOf, compareByBrandRelease } from "./systems";
import type { AppState, CustomGroup, Emulator, GroupingMode } from "./types";

export interface Section {
  /** Benzersiz bölüm anahtarı: "all" | marka | grup id | "__ungrouped__". */
  key: string;
  /** Başlık; null ise başlıksız düz liste. */
  title: string | null;
  items: Emulator[];
  /** Özel grup bölümüyse ilgili grup (yönetim düğmeleri için). */
  group?: CustomGroup;
}

export const UNGROUPED = "__ungrouped__";

/** Görüntü sırası: elle sıralıysa dizinin kendisi, değilse marka → yıl → ad. */
export function orderedEmulators(state: AppState): Emulator[] {
  if (state.settings.manualSort) return state.emulators;
  return [...state.emulators].sort(compareByBrandRelease);
}

/** Bir emülatörün, verilen düzende hangi bölüme ait olduğunu döndürür. */
export function sectionKeyOf(e: Emulator, mode: GroupingMode, groups: CustomGroup[]): string {
  if (mode === "flat") return "all";
  if (mode === "brand") return brandOf(e.systemId);
  if (e.groupId && groups.some((g) => g.id === e.groupId)) return e.groupId;
  return UNGROUPED;
}

/** Görüntü listesini seçilen düzene göre bölümlere ayırır. */
export function buildSections(
  ordered: Emulator[],
  mode: GroupingMode,
  groups: CustomGroup[],
): Section[] {
  if (mode === "flat") {
    return [{ key: "all", title: null, items: ordered }];
  }
  if (mode === "brand") {
    return BRAND_ORDER.map((brand) => ({
      key: brand,
      title: brand,
      items: ordered.filter((e) => brandOf(e.systemId) === brand),
    })).filter((s) => s.items.length > 0);
  }
  // custom: her grup (boş olsa da) + sonda gruplanmamışlar
  const sections: Section[] = groups.map((g) => ({
    key: g.id,
    title: g.name,
    group: g,
    items: ordered.filter((e) => e.groupId === g.id),
  }));
  const ungrouped = ordered.filter(
    (e) => !e.groupId || !groups.some((g) => g.id === e.groupId),
  );
  if (ungrouped.length > 0) {
    sections.push({ key: UNGROUPED, title: "Gruplanmamış", items: ungrouped });
  }
  return sections;
}

/**
 * dragId'yi targetId'nin önüne (targetId yoksa bölümün sonuna) taşıyarak yeni
 * emülatör dizisini üretir. Çağıran taraf, sonucu manualSort=true ile kaydeder.
 */
export function reorder(
  state: AppState,
  dragId: string,
  targetId: string | null,
  sectionKey: string,
): Emulator[] {
  const mode = state.settings.grouping;
  // Elle sıra kapalıysa önce görüntü sırasını sabitle.
  const base = orderedEmulators(state);
  const dragEmu = base.find((e) => e.id === dragId);
  if (!dragEmu) return state.emulators;

  const arr = base.filter((e) => e.id !== dragId);

  if (targetId && targetId !== dragId) {
    const idx = arr.findIndex((e) => e.id === targetId);
    if (idx >= 0) {
      arr.splice(idx, 0, dragEmu);
      return arr;
    }
  }
  // Bölümün sonuna ekle: aynı bölümdeki son öğeden hemen sonra.
  let lastIdx = -1;
  for (let i = 0; i < arr.length; i++) {
    if (sectionKeyOf(arr[i], mode, state.groups) === sectionKey) lastIdx = i;
  }
  arr.splice(lastIdx + 1, 0, dragEmu);
  return arr;
}
