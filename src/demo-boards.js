const localeFiles = import.meta.glob("./data/*-demo_*.json", { eager: true, import: "default" });

const packs = {};
for (const [filePath, data] of Object.entries(localeFiles)) {
  const file = filePath.split("/").pop() || "";
  const match = file.match(/^(.+)_([a-z]{2})\.json$/);
  if (!match || !data) continue;
  const demoId = data.demoId || match[1];
  const locale = match[2];
  if (!packs[demoId]) packs[demoId] = {};
  packs[demoId][locale] = data;
}

/** Built-in demos, in dashboard order. `back-to-the-future` is not part of this set. */
export const DEMO_IDS = [
  "matrix-demo",
  "the-godfather-hero-journey-demo",
  "matrix-reloaded-three-act-demo",
  "matrix-revolution-save-the-cat-demo",
  "odyssey-hero-thousand-faces-demo",
  "harry-potter-hero-thousand-faces-demo",
  "jurassic-park-three-act-demo",
  "blade-runner-save-the-cat-demo",
  "finding-nemo-story-circle-demo",
  "the-hunger-games-seven-point-demo",
  "pride-and-prejudice-romancing-the-beat-demo",
  "inception-mice-quotient-demo",
  "murder-on-the-orient-express-12-step-mystery-demo",
];

export const DEMO_LOCALES = ["en", "it", "es"];

export const MATRIX_TRILOGY = {
  demoIds: ["matrix-demo", "matrix-reloaded-three-act-demo", "matrix-revolution-save-the-cat-demo"],
  titles: {
    en: "The Matrix Trilogy",
    it: "La trilogia di Matrix",
    es: "La trilogía de Matrix",
  },
};

export function normalizeDemoLocale(locale) {
  return locale === "it" || locale === "es" ? locale : "en";
}

export function getDemoDefinition(demoId, locale) {
  const pack = packs[demoId];
  if (!pack) return null;
  const lang = normalizeDemoLocale(locale);
  const data = pack[lang] || pack.en;
  if (!data) return null;
  return { ...data, demoId, demoLocale: data === pack[lang] ? lang : "en" };
}

export function getDemoBoardData(locale) {
  return DEMO_IDS.map((demoId) => getDemoDefinition(demoId, locale)).filter(Boolean);
}

export function demoContentSignature(source) {
  const notes = Array.isArray(source?.notes) ? source.notes : [];
  return JSON.stringify({
    title: String(source?.title || "").trim(),
    structure: String(source?.structure || "").trim(),
    notes: notes
      .map((note, index) => ({
        kind: note.kind || "plot",
        column: Number.isInteger(note.column) ? note.column : 0,
        order: Number.isInteger(note.order) ? note.order : index,
        text: String(note.text || "").trim(),
        characterName: String(note.characterName || "").trim(),
        archetype: note.archetype || "none",
        customHeight: Number.isFinite(note.customHeight) ? note.customHeight : null,
      }))
      .sort((a, b) => a.column - b.column || a.order - b.order || a.text.localeCompare(b.text)),
  });
}

export function demoBoardMatches(board, data) {
  if (!board || !data) return false;
  return demoContentSignature(board) === demoContentSignature(data);
}

export function findDemoIdForBoard(board) {
  if (!board) return null;
  if (board.demoId && packs[board.demoId]) return board.demoId;
  for (const demoId of DEMO_IDS) {
    for (const locale of DEMO_LOCALES) {
      const data = packs[demoId]?.[locale];
      if (data && demoBoardMatches(board, data)) return demoId;
    }
  }
  for (const demoId of DEMO_IDS) {
    for (const locale of DEMO_LOCALES) {
      const data = packs[demoId]?.[locale];
      if (!data) continue;
      const sameTitle = String(board.title || "").trim().toLowerCase() === String(data.title || "").trim().toLowerCase();
      const sameStructure = String(board.structure || "").trim() === String(data.structure || "").trim();
      if (sameTitle && sameStructure) return demoId;
    }
  }
  return null;
}

export function demoSlugFromTitle(title) {
  const normalized = String(title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "board";
}

export function findDemoIdByTitleSlug(slug) {
  const wanted = String(slug || "").trim().toLowerCase();
  if (!wanted) return null;
  for (const demoId of DEMO_IDS) {
    for (const locale of DEMO_LOCALES) {
      const data = packs[demoId]?.[locale];
      if (data && demoSlugFromTitle(data.title) === wanted) return demoId;
    }
  }
  return null;
}

export function isMatrixTrilogyTitleSlug(slug) {
  const wanted = String(slug || "").trim().toLowerCase();
  return Object.values(MATRIX_TRILOGY.titles).some((title) => demoSlugFromTitle(title) === wanted);
}

export function isUnmodifiedDemoContent(board, demoId) {
  const pack = packs[demoId];
  if (!board || !pack) return false;
  const locales =
    board.demoLocale && pack[board.demoLocale] ? [board.demoLocale] : DEMO_LOCALES.filter((locale) => pack[locale]);
  return locales.some((locale) => demoBoardMatches(board, pack[locale]));
}
