import { en as builtinStructureCopy } from "./i18n/structures.en.js";

export const BUILTIN_STRUCTURES = Object.fromEntries(
  Object.entries(builtinStructureCopy).map(([id, copy]) => [id, { id, ...copy }]),
);

export const STORAGE_KEY = "structurer.boards.v1";
export const SETTINGS_KEY = "structurer.settings.v1";
/** Set to `"true"` in localStorage to expose undocumented `window.structurerDev` helpers (see `main.js`). */
export const STRUCTURER_DEV_FLAG_KEY = "structurer.dev";
/** Per-board list of column indices with phase description panel open (editor UI). */
export const PHASE_HELP_STATE_KEY = "structurer.phaseHelpOpen.v1";
/** One-time editor tip: click note to edit, + to add (dismissed with "Got it"). */
export const EDITOR_QUICK_HELP_DISMISSED_KEY = "structurer.editorQuickHelpDismissed.v1";
export const CUSTOM_STRUCTURES_KEY = "structurer.customStructures.v1";
export const CUSTOM_ARCHETYPES_KEY = "structurer.customArchetypes.v1";
export const CUSTOM_NOTE_TYPES_KEY = "structurer.customNoteTypes.v1";
export const NOTE_TYPE_OVERRIDES_KEY = "structurer.noteTypeOverrides.v1";
export const HOME_ROUTE = "/dashboard";
export const DEFAULT_COLUMN_WIDTH = 260;

export const BUILTIN_ARCHETYPES = [
  { id: "none", icon: "", label: "No specific role" },
  { id: "hero", icon: "🛡️", label: "Hero" },
  { id: "mentor", icon: "🧙", label: "Mentor" },
  { id: "ally", icon: "🤝", label: "Ally" },
  { id: "herald", icon: "📣", label: "Herald" },
  { id: "guardian", icon: "🚧", label: "Threshold Guardian" },
  { id: "shadow", icon: "🕶️", label: "Shadow/Antagonist" },
  { id: "trickster", icon: "🃏", label: "Trickster" },
  { id: "shapeshifter", icon: "🦊", label: "Shapeshifter" },
];

export const BUILTIN_NOTE_TYPES = [
  { id: "plot", label: "Plot", color: "#fef08a" },
  { id: "character", label: "Character", color: "#bfdbfe" },
  { id: "theme", label: "Theme", color: "#bbf7d0" },
  { id: "subplot", label: "Subplot", color: "#d9f99d" },
  { id: "detail", label: "Detail", color: "#a5f3fc" },
  { id: "flashback", label: "Flashback", color: "#b8fde9" },
  { id: "time", label: "Time", color: "#f5f0eb" },
  { id: "topic", label: "Topic", color: "#e9d5ff" },
  { id: "question", label: "Question", color: "#fbcfc8" },
  { id: "reference", label: "Reference", color: "#f8f8f8" },
  { id: "todo", label: "Todo", color: "#eef0f2" },
  { id: "location", label: "Location", color: "#f5f0ae" },
  { id: "milestone", label: "Milestone", color: "#cefafa" },
];
