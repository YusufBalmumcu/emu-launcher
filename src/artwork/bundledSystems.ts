import { systemLogo } from "../systems";
import type { ArtworkProvider, ArtworkRequest } from "./types";

/** src/assets/systems altındaki gömülü konsol logolarını sunar. */
export const bundledSystemProvider: ArtworkProvider = {
  id: "bundled-systems",
  supports: (kind) => kind === "system-icon",
  resolveSync(req: ArtworkRequest) {
    if (req.kind !== "system-icon") return null;
    return systemLogo(req.systemId) ?? null;
  },
  async resolve(req: ArtworkRequest) {
    return this.resolveSync!(req);
  },
};
