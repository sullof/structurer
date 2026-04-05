/**
 * Builds a copy-paste prompt for an LLM to produce Structurer-compatible story JSON
 * (schemaVersion 3: canonical `structureId`, human-readable `structure` name, notes[]).
 */

/**
 * @param {object} opts
 * @param {string} opts.structureId - Exact `structureId` string for JSON (app catalog id, e.g. hero_journey).
 * @param {string} opts.structureName - Display name for JSON `structure` (human reference only; must match app spelling).
 * @param {string} opts.workTitle - Film / book / show title.
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
  medium,
  analysisLanguage = "English",
  phaseTitles,
  noteKinds,
  archetypes,
}) {
  const mediumLine = medium && medium !== "unspecified" ? `Medium: ${medium}.` : "";
  const phaseBlock = phaseTitles
    .map((title, i) => `- Column ${i} (${JSON.stringify(title)}): place notes that belong to this story beat.`)
    .join("\n");

  const kindLines = noteKinds.map((k) => `  - "${k.id}" (${k.label})`).join("\n");
  const archetypeLines = archetypes
    .filter((a) => a.id && a.id !== "none")
    .map((a) => `  - "${a.id}" — ${a.label}`)
    .join("\n");

  return `You are helping a writer import a narrative analysis into Structurer (a browser-based story board).

Task: produce a SINGLE valid JSON object (no markdown code fences, no commentary before or after) that Structurer can import as a story.

Work to analyze: ${JSON.stringify(workTitle)}.
Narrative framework: ${JSON.stringify(structureName)} (Structurer id: ${JSON.stringify(structureId)}).
${mediumLine}

Column mapping (each column is one phase; use 0-based indices in each note's "column" field):
${phaseBlock}

Root JSON shape:
{
  "schemaVersion": 3,
  "title": string (e.g. the work title or "Analysis: …"),
  "structureId": string — MUST be exactly: ${JSON.stringify(structureId)} (this identifies the narrative framework in the app; do not invent or change it),
  "structure": string — for human readability only; use exactly: ${JSON.stringify(structureName)} (must match the display name for this framework in Structurer; do not translate),
  "aiAnalysisImport": true,
  "notes": [ ... ]
}

You MUST include integer "schemaVersion": 3, "structureId" exactly as given, and "aiAnalysisImport": true (boolean) at the root. Structurer uses "structureId" to load the correct column layout; "structure" is not used for matching. Structurer uses "aiAnalysisImport" to treat this board as an LLM-generated analysis (same visibility bucket as demos: "Hide demos" can hide analyses too). Omitting "aiAnalysisImport" or setting it to false makes the import a normal user story.

Each note object:
- "kind": one of these string ids (use the id exactly):
${kindLines}
- "column": integer from 0 to ${phaseTitles.length - 1}
- "order": integer, order within that column (0, 1, 2, …)
- "text": string — concise analysis for that note

For kind "character" ONLY, also include:
- "characterName": string
- "archetype": one of these ids (pick the best fit):
${archetypeLines}

Language for readable content:
- Write every note's "text" field in ${JSON.stringify(analysisLanguage)}. Apply the same language to any other prose in the JSON that is meant for a human reader, except where this prompt requires a fixed value (see below).
- Keep JSON key names in English. Keep "kind" and "archetype" string values exactly as the ids listed above. The root "structureId" string MUST remain exactly: ${JSON.stringify(structureId)}. The root "structure" string MUST remain exactly: ${JSON.stringify(structureName)} (do not translate either).
- Proper names (work title, character names, places) may follow the work's usual spelling even when it differs from ${JSON.stringify(analysisLanguage)}.

Rules:
- Always include "schemaVersion": 3, "structureId", "structure", and "aiAnalysisImport": true at the root (see above).
- Do not include "uid" fields; the app will assign them.
- Spread notes across columns according to where each beat belongs in ${JSON.stringify(structureName)}.
- Use several notes per phase where useful (plot + theme + character, etc.), similar in spirit to Structurer demo stories.
- Output must be parseable JSON only.`;
}
