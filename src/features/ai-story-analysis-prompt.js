/**
 * Builds a copy-paste prompt for an LLM to produce Structurer-compatible story JSON
 * (schemaVersion 3: canonical `structureId`, human-readable `structure` name, notes[]).
 */

/**
 * @param {object} opts
 * @param {string} opts.structureId - Exact `structureId` string for JSON (app catalog id, e.g. hero_journey).
 * @param {string} opts.structureName - Display name for JSON `structure` (human reference only; must match app spelling).
 * @param {string} opts.workTitle - Film / book / show title (analysis mode).
 * @param {"analysis"|"synopsis"} [opts.mode]
 * @param {string} [opts.synopsis] - Writer's own synopsis (synopsis mode).
 * @param {string} [opts.storyTitle] - Optional title for the writer's story (synopsis mode).
 * @param {string} opts.medium - e.g. "film", "novel", "TV series".
 * @param {string} opts.analysisLanguage - Language for narrative text in notes (e.g. "English", "Italian").
 * @param {string[]} opts.phaseTitles - One label per column, index = column number.
 * @param {{ id: string, label: string }[]} opts.noteKinds
 * @param {{ id: string, label: string, icon?: string }[]} opts.archetypes
 */
export function buildLlmStoryAnalysisPrompt({
  structureId,
  structureName,
  workTitle,
  mode = "analysis",
  synopsis = "",
  storyTitle = "",
  medium,
  analysisLanguage = "English",
  phaseTitles,
  noteKinds,
  archetypes,
}) {
  const isSynopsis = mode === "synopsis";
  const kinds = isSynopsis ? noteKinds : noteKinds.filter((kind) => kind.id !== "absence");
  const mediumLine = medium && medium !== "unspecified" ? `Medium: ${medium}.` : "";
  const phaseBlock = phaseTitles
    .map((title, i) => `- Column ${i} (${JSON.stringify(title)}): place notes that belong to this story beat.`)
    .join("\n");

  const kindLines = kinds.map((k) => `  - "${k.id}" (${k.label})`).join("\n");
  const archetypeLines = archetypes
    .filter((a) => a.id && a.id !== "none")
    .map((a) => `  - "${a.id}" — ${a.label}`)
    .join("\n");
  const titleInstruction = storyTitle.trim()
    ? `Use exactly this story title: ${JSON.stringify(storyTitle.trim())}.`
    : "The writer did not give a title. Set \"title\" to a short working title in the note language, taken only from a title or name already present in the synopsis. If the synopsis has none, invent a brief descriptive title and do not present it as a published work.";

  const sourceBlock = isSynopsis
    ? `Task: turn the writer's own synopsis into a story board. This is not an analysis of a published work. Do not look up, recall, or add events from any existing book, film, or show.

Synopsis (the only source of events):
${synopsis.trim()}

${titleInstruction}
Narrative framework: ${JSON.stringify(structureName)} (Structurer id: ${JSON.stringify(structureId)}).
${mediumLine}`
    : `Task: produce a narrative analysis of a known work.

Work to analyze: ${JSON.stringify(workTitle)}.
Narrative framework: ${JSON.stringify(structureName)} (Structurer id: ${JSON.stringify(structureId)}).
${mediumLine}`;

  const rootShape = isSynopsis
    ? `{
  "schemaVersion": 3,
  "title": string,
  "structureId": string — MUST be exactly: ${JSON.stringify(structureId)} (this identifies the narrative framework in the app; do not invent or change it),
  "structure": string — for human readability only; use exactly: ${JSON.stringify(structureName)} (must match the display name for this framework in Structurer; do not translate),
  "notes": [ ... ]
}

You MUST include integer "schemaVersion": 3 and "structureId" exactly as given. Do NOT include "aiAnalysisImport". Omitting it makes the import a normal user story, which is what this synopsis is. Structurer uses "structureId" to load the correct column layout; "structure" is not used for matching.`
    : `{
  "schemaVersion": 3,
  "title": string (e.g. the work title or "Analysis: …"),
  "structureId": string — MUST be exactly: ${JSON.stringify(structureId)} (this identifies the narrative framework in the app; do not invent or change it),
  "structure": string — for human readability only; use exactly: ${JSON.stringify(structureName)} (must match the display name for this framework in Structurer; do not translate),
  "aiAnalysisImport": true,
  "notes": [ ... ]
}

You MUST include integer "schemaVersion": 3, "structureId" exactly as given, and "aiAnalysisImport": true (boolean) at the root. Structurer uses "structureId" to load the correct column layout; "structure" is not used for matching. Structurer uses "aiAnalysisImport" to treat this board as an LLM-generated analysis (same visibility bucket as demos: "Hide demos" can hide analyses too). Omitting "aiAnalysisImport" or setting it to false makes the import a normal user story.`;

  const gapRules = isSynopsis
    ? `
Gaps (required):
- The synopsis is the only source of events. Do not invent plot, characters, motives, scenes, or dialogue that are not in it.
- Place events that are present into the matching columns of ${JSON.stringify(structureName)}.
- For every phase the synopsis does not cover, add one note with "kind": "absence" in that phase's column. The note's "text" must name the phase and say what is missing, in the note language. It must not supply the missing event.
- Example: if the framework includes a Call to Adventure and nothing in the synopsis is that beat, the Call to Adventure column contains an absence note and no invented call.
- If a phase is only partly present, keep the real events as normal notes and add one absence note after them describing what is still missing.
- Do not use "absence" for material that is actually in the synopsis. A phase that is fully present has no absence note.
- A column with no events at all contains only the absence note.`
    : `
- Spread notes across columns according to where each beat belongs in ${JSON.stringify(structureName)}.
- Use several notes per phase where useful (plot + theme + character, etc.), similar in spirit to Structurer demo stories.`;

  const rootRule = isSynopsis
    ? `- Always include "schemaVersion": 3, "structureId", and "structure" at the root. Do not include "aiAnalysisImport".`
    : `- Always include "schemaVersion": 3, "structureId", "structure", and "aiAnalysisImport": true at the root (see above).`;

  return `You are helping a writer import a story into Structurer (a browser-based story board).

Produce a SINGLE valid JSON object (no markdown code fences, no commentary before or after) that Structurer can import as a story.

${sourceBlock}
Column mapping (each column is one phase; use 0-based indices in each note's "column" field):
${phaseBlock}

Root JSON shape:
${rootShape}

Each note object:
- "kind": one of these string ids (use the id exactly):
${kindLines}
- "column": integer from 0 to ${phaseTitles.length - 1}
- "order": integer, order within that column (0, 1, 2, …)
- "text": string — concise text for that note

For kind "character" ONLY, also include:
- "characterName": string
- "archetype": one of these ids (pick the best fit):
${archetypeLines}

Language for readable content:
- Write every note's "text" field in ${JSON.stringify(analysisLanguage)}. Apply the same language to any other prose in the JSON that is meant for a human reader, except where this prompt requires a fixed value (see below).
- Keep JSON key names in English. Keep "kind" and "archetype" string values exactly as the ids listed above. The root "structureId" string MUST remain exactly: ${JSON.stringify(structureId)}. The root "structure" string MUST remain exactly: ${JSON.stringify(structureName)} (do not translate either).
- Proper names (work title, character names, places) may follow the work's usual spelling even when it differs from ${JSON.stringify(analysisLanguage)}.

Rules:
${rootRule}
- Do not include "uid" fields; the app will assign them.
${gapRules}
- Output must be parseable JSON only.`;
}
