/**
 * Builds a copy-paste prompt for an LLM to produce Structurer-compatible story JSON
 * (same minimal shape as demo imports: title, structure name, notes[]).
 */

/**
 * @param {object} opts
 * @param {string} opts.structureName - Exact `structure` string for JSON (catalog display name).
 * @param {string} opts.workTitle - Film / book / show title.
 * @param {string} opts.medium - e.g. "film", "novel", "TV series".
 * @param {string[]} opts.phaseTitles - One label per column, index = column number.
 * @param {{ id: string, label: string }[]} opts.noteKinds
 * @param {{ id: string, label: string, icon?: string }[]} opts.archetypes
 */
export function buildLlmStoryAnalysisPrompt({
  structureName,
  workTitle,
  medium,
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
Narrative framework: ${JSON.stringify(structureName)}.
${mediumLine}

Column mapping (each column is one phase; use 0-based indices in each note's "column" field):
${phaseBlock}

Root JSON shape:
{
  "title": string (e.g. the work title or "Analysis: …"),
  "structure": string — MUST be exactly: ${JSON.stringify(structureName)},
  "notes": [ ... ]
}

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

Rules:
- Do not include "uid" fields; the app will assign them.
- Spread notes across columns according to where each beat belongs in ${JSON.stringify(structureName)}.
- Use several notes per phase where useful (plot + theme + character, etc.), similar in spirit to Structurer demo stories.
- Keep "structure" spelling and capitalization identical to the required value above.
- Output must be parseable JSON only.`;
}
