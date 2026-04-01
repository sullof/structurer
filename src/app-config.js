export const STORAGE_KEY = "structurer.boards.v1";
export const SETTINGS_KEY = "structurer.settings.v1";
export const CUSTOM_STRUCTURES_KEY = "structurer.customStructures.v1";
export const CUSTOM_ARCHETYPES_KEY = "structurer.customArchetypes.v1";
export const CUSTOM_NOTE_TYPES_KEY = "structurer.customNoteTypes.v1";
export const DEV_RESET_FLAG_KEY = "activate.reset";
export const HOME_ROUTE = "/dashboard";
export const DEFAULT_COLUMN_WIDTH = 260;

export const BUILTIN_STRUCTURES = {
  hero_journey: {
    id: "hero_journey",
    name: "Hero's Journey",
    phases: [
      "Ordinary World",
      "Call to Adventure",
      "Refusal of the Call",
      "Meeting the Mentor",
      "Crossing the Threshold",
      "Tests, Allies, Enemies",
      "Approach to the Inmost Cave",
      "Ordeal",
      "Reward",
      "The Road Back",
      "Resurrection",
      "Return with the Elixir",
    ],
  },
  three_act: {
    id: "three_act",
    name: "Three-Act Structure",
    phases: [
      "Act I - Setup",
      "Act I - Inciting Incident",
      "Act II - Progressive Complications",
      "Act II - Midpoint",
      "Act II - Crisis",
      "Act II - Break into Act III",
      "Act III - Climax",
      "Act III - Resolution",
    ],
  },
  save_the_cat: {
    id: "save_the_cat",
    name: "Save the Cat",
    phases: [
      "Opening Image",
      "Theme Stated",
      "Set-Up",
      "Catalyst",
      "Debate",
      "Break into Two",
      "B Story",
      "Fun and Games",
      "Midpoint",
      "Bad Guys Close In",
      "All Is Lost",
      "Dark Night of the Soul",
      "Break into Three",
      "Finale",
      "Final Image",
    ],
  },
  story_circle: {
    id: "story_circle",
    name: "Story Circle",
    phases: [
      "You (Comfort Zone)",
      "Need",
      "Go",
      "Search",
      "Find",
      "Take",
      "Return",
      "Change",
    ],
  },
  seven_point: {
    id: "seven_point",
    name: "7-Point Story Structure",
    phases: [
      "Hook",
      "Plot Turn 1",
      "Pinch Point 1",
      "Midpoint",
      "Pinch Point 2",
      "Plot Turn 2",
      "Resolution",
    ],
  },
  romancing_the_beat: {
    id: "romancing_the_beat",
    name: "Romancing the Beat",
    phases: [
      "Setup and Need",
      "Meet and Spark",
      "No Way / Resistance",
      "Adhesion / Forced Proximity",
      "Deepening Desire",
      "Retreat and Doubt",
      "Breakup / Crisis",
      "Grand Gesture",
      "Commitment / HEA-HFN",
    ],
  },
  mice_quotient: {
    id: "mice_quotient",
    name: "MICE Quotient",
    phases: [
      "Milieu Question Open",
      "Idea Question Open",
      "Character Question Open",
      "Event Question Open",
      "Event Question Close",
      "Character Question Close",
      "Idea Question Close",
      "Milieu Question Close",
    ],
  },
};

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
];
