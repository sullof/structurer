export const STORAGE_KEY = "structurer.boards.v1";
export const SETTINGS_KEY = "structurer.settings.v1";
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

export const BUILTIN_STRUCTURES = {
  hero_journey: {
    id: "hero_journey",
    name: "Hero's Journey",
    description:
      "Twelve stages that track a protagonist from ordinary life through ordeal and transformation to return with something that changes their world. The pattern synthesizes comparative mythology (Campbell’s monomyth) into a practical map for fiction and film; Christopher Vogler’s late-20th-century guide for screenwriters made this shape especially familiar in Hollywood.",
    author: "After Joseph Campbell; widely used in writing craft via Christopher Vogler’s interpretations.",
    phases: [
      {
        title: "Ordinary World",
        description:
          "The hero’s normal life before the story kicks in—establish the everyday world, tone, and what could change.",
      },
      {
        title: "Call to Adventure",
        description:
          "Something disrupts the ordinary world: a problem, invitation, or event that presents the quest and refuses to be ignored.",
      },
      {
        title: "Refusal of the Call",
        description:
          "The hero hesitates, resists, or refuses the journey, revealing fear, stakes, and what they might lose.",
      },
      {
        title: "Meeting the Mentor",
        description:
          "A guide offers advice, training, or a gift that prepares the hero to face the unknown.",
      },
      {
        title: "Crossing the Threshold",
        description:
          "The hero commits and enters a new world where old rules no longer apply.",
      },
      {
        title: "Tests, Allies, Enemies",
        description:
          "Challenges reveal strengths and weaknesses while relationships and opposition take shape.",
      },
      {
        title: "Approach to the Inmost Cave",
        description:
          "The hero and allies prepare for the central confrontation, closing in on the core danger.",
      },
      {
        title: "Ordeal",
        description:
          "A major crisis forces a life-or-death confrontation and transforms the hero through sacrifice or loss.",
      },
      {
        title: "Reward",
        description:
          "After surviving the ordeal, the hero gains a prize, insight, or power that advances the goal.",
      },
      {
        title: "The Road Back",
        description:
          "Consequences strike as the hero turns toward home, often chased by unresolved conflict.",
      },
      {
        title: "Resurrection",
        description:
          "A final test demands the hero’s fullest change and proves who they have become.",
      },
      {
        title: "Return with the Elixir",
        description:
          "The hero returns with what was gained and applies it to heal, save, or renew the ordinary world.",
      },
    ],
  },
  hero_thousand_faces: {
    id: "hero_thousand_faces",
    name: "Hero with a Thousand Faces",
    description:
      "Campbell’s narrative pattern of departure, initiation, and return, expressed as a sequence of mythic beats (call, aid, trials, revelation, atonement, and freedom). Useful when you want a classical arc that emphasizes symbolic death and rebirth more than beat-sheet commerce.",
    author: "Joseph Campbell (The Hero with a Thousand Faces, 1949).",
    phases: [
      {
        title: "Call to Adventure",
        description:
          "An event summons the hero beyond ordinary life toward a meaningful unknown.",
      },
      {
        title: "Refusal of the Call",
        description:
          "The hero resists the summons, exposing fear, duty, or attachment to the old world.",
      },
      {
        title: "Supernatural Aid",
        description:
          "A protector, mentor, or talisman appears to equip the hero for the journey.",
      },
      {
        title: "Crossing the First Threshold",
        description:
          "The hero passes from the familiar into the realm of adventure and consequence.",
      },
      {
        title: "Belly of the Whale",
        description:
          "An initiation moment where the old self symbolically dies and transformation begins.",
      },
      {
        title: "Road of Trials",
        description:
          "A sequence of tests and encounters that build competence, allies, and inner change.",
      },
      {
        title: "Meeting with the Goddess",
        description:
          "The hero experiences revelation, grace, or a vision of wholeness that reorients the quest.",
      },
      {
        title: "Woman as Temptress",
        description:
          "A seductive distraction—literal or symbolic—threatens to pull the hero off purpose.",
      },
      {
        title: "Atonement with the Father",
        description:
          "The hero confronts ultimate authority and resolves a core source of fear or conflict.",
      },
      {
        title: "Apotheosis",
        description:
          "A moment of elevated understanding where the hero gains expanded perspective.",
      },
      {
        title: "The Ultimate Boon",
        description:
          "The hero secures the treasure, knowledge, or power sought by the journey.",
      },
      {
        title: "Refusal of the Return",
        description:
          "After attaining the boon, the hero hesitates to return to ordinary life.",
      },
      {
        title: "The Magic Flight",
        description:
          "The return becomes urgent, dangerous, or contested as forces resist the hero’s escape.",
      },
      {
        title: "Rescue from Without",
        description:
          "Outside help intervenes when the hero cannot complete the return alone.",
      },
      {
        title: "Crossing of the Return Threshold",
        description:
          "The hero re-enters everyday reality and must integrate extraordinary experience.",
      },
      {
        title: "Master of Two Worlds",
        description:
          "The hero balances inner and outer worlds, wielding wisdom in both realms.",
      },
      {
        title: "Freedom to Live",
        description:
          "Released from fear of loss or death, the hero can act fully in the present.",
      },
    ],
  },
  three_act: {
    id: "three_act",
    name: "Three-Act Structure",
    description:
      "Divides the story into setup, confrontation, and resolution, with turning points that escalate stakes and narrow the protagonist’s options. It is the backbone of much Western drama, theatre, and screenwriting pedagogy—not a formula, but a rhythm of imbalance and restoration.",
    author: "Traditional dramatic form; countless modern craft books and syllabi.",
    phases: [
      {
        title: "Act I - Setup",
        description:
          "Introduce protagonist, world, goals, relationships, and the baseline before disruption.",
      },
      {
        title: "Act I - Inciting Incident",
        description:
          "A turning event upsets normal life and launches the story problem.",
      },
      {
        title: "Act II - Progressive Complications",
        description:
          "Escalating obstacles force harder choices and reveal deeper conflict.",
      },
      {
        title: "Act II - Midpoint",
        description:
          "A major reversal or revelation changes stakes, strategy, or understanding.",
      },
      {
        title: "Act II - Crisis",
        description:
          "Pressure peaks; the protagonist faces a no-win dilemma or painful low point.",
      },
      {
        title: "Act II - Break into Act III",
        description:
          "A decisive choice commits the protagonist to the final confrontation.",
      },
      {
        title: "Act III - Climax",
        description:
          "Central conflict resolves through action and the protagonist’s defining move.",
      },
      {
        title: "Act III - Resolution",
        description:
          "Show aftermath, new equilibrium, and the lasting effect of the journey.",
      },
    ],
  },
  save_the_cat: {
    id: "save_the_cat",
    name: "Save the Cat",
    description:
      "A fifteen-beat screenplay template that names each major pivot from opening image to final image, with explicit beats for theme, fun-and-games, midpoint, all-is-lost, and finale. Designed for clarity, pacing, and reader-friendly spec scripts.",
    author: "Blake Snyder (Save the Cat!, 2005).",
    phases: [
      {
        title: "Opening Image",
        description:
          "A snapshot of the hero’s world before change; establish tone and starting point.",
      },
      {
        title: "Theme Stated",
        description:
          "Someone voices the story’s central lesson or question, often before the hero understands it.",
      },
      {
        title: "Set-Up",
        description:
          "Build characters, flaws, stakes, and relationships that will be tested later.",
      },
      {
        title: "Catalyst",
        description:
          "A disruptive event forces the hero out of routine and creates a clear problem.",
      },
      {
        title: "Debate",
        description:
          "The hero resists action, weighing fear, cost, and uncertainty before committing.",
      },
      {
        title: "Break into Two",
        description:
          "The hero chooses to enter the upside-down world of Act II.",
      },
      {
        title: "B Story",
        description:
          "A relational or thematic subplot begins and supports the hero’s transformation.",
      },
      {
        title: "Fun and Games",
        description:
          "Deliver the premise: the hero explores the new world, wins and fails in fresh ways.",
      },
      {
        title: "Midpoint",
        description:
          "A false victory or defeat raises stakes and shifts the hero from reaction to commitment.",
      },
      {
        title: "Bad Guys Close In",
        description:
          "External and internal pressures tighten, eroding gains from earlier successes.",
      },
      {
        title: "All Is Lost",
        description:
          "A crushing setback makes the goal seem impossible; often includes symbolic loss.",
      },
      {
        title: "Dark Night of the Soul",
        description:
          "At emotional rock bottom, the hero processes failure and finds a new truth.",
      },
      {
        title: "Break into Three",
        description:
          "With insight and support, the hero commits to a final plan.",
      },
      {
        title: "Finale",
        description:
          "Execute the final confrontation, proving growth and resolving core conflict.",
      },
      {
        title: "Final Image",
        description:
          "A closing image that mirrors the opening and shows how the world has changed.",
      },
    ],
  },
  story_circle: {
    id: "story_circle",
    name: "Story Circle",
    description:
      "Eight steps in a circle: need, go, search, find, take, return, change—mapping how a character leaves comfort, pays a price, and comes back different. Compact and iterative, it suits serialized TV and tight character arcs.",
    author: "Dan Harmon (Channel 101 / Story Structure 104).",
    phases: [
      {
        title: "YOU - Establish a protagonist",
        description:
          "Ground the audience in who the protagonist is and what their normal life looks like.",
      },
      {
        title: "NEED - Something ain't quite right",
        description:
          "Reveal a lack, wound, or desire that creates tension and motivates movement.",
      },
      {
        title: "GO - Crossing the threshold",
        description:
          "The protagonist leaves comfort and enters an unfamiliar situation or world.",
      },
      {
        title: "SEARCH - The road of trials",
        description:
          "They adapt through experiments, failures, allies, and opposition.",
      },
      {
        title: "FIND - Meeting with the goddess",
        description:
          "They reach what they wanted or needed, often with a surprising cost.",
      },
      {
        title: "TAKE - Meet your maker",
        description:
          "A hard price is paid: sacrifice, loss, or confrontation with deepest fear.",
      },
      {
        title: "RETURN - Bringing it home",
        description:
          "The protagonist comes back to the original world carrying what was gained.",
      },
      {
        title: "CHANGE - Master of both worlds",
        description:
          "Show lasting transformation in values, behavior, or identity.",
      },
    ],
  },
  seven_point: {
    id: "seven_point",
    name: "7-Point Story Structure",
    description:
      "Seven anchors—hook, two plot turns, two pinch points, midpoint, resolution—often plotted twice (first pass for plot, second mirrored for character) so structure stays lean but symmetrical. Strong for outlining before you expand into scenes.",
    author: "Dan Wells (7-Point Story Structure workshop).",
    phases: [
      {
        title: "Hook",
        description:
          "Set the protagonist’s starting state and what is missing or broken.",
      },
      {
        title: "Plot Turn 1",
        description:
          "A major event moves the hero from setup into active conflict.",
      },
      {
        title: "Pinch Point 1",
        description:
          "A pressure beat that highlights the antagonist force and raises danger.",
      },
      {
        title: "Midpoint",
        description:
          "A pivotal revelation or reversal changes direction and increases stakes.",
      },
      {
        title: "Pinch Point 2",
        description:
          "A stronger pressure beat shows the cost of failure and narrows options.",
      },
      {
        title: "Plot Turn 2",
        description:
          "The final turning point that launches the endgame.",
      },
      {
        title: "Resolution",
        description:
          "Climax and aftermath: conflicts conclude and the new normal is shown.",
      },
    ],
  },
  romancing_the_beat: {
    id: "romancing_the_beat",
    name: "Romancing the Beat",
    description:
      "Nine emotional beats tailored to romance: setup, meet, resistance, proximity, deepening desire, retreat, crisis, grand gesture, and commitment. Emphasizes internal need and relational push-pull rather than external plot machinery alone.",
    author: "Gwen Hayes (Romancing the Beat).",
    phases: [
      {
        title: "Setup and Need",
        description:
          "Establish each lead’s life, emotional wound, and what they truly need in love.",
      },
      {
        title: "Meet and Spark",
        description:
          "The leads meet and generate attraction, friction, or undeniable chemistry.",
      },
      {
        title: "No Way / Resistance",
        description:
          "Both resist connection due to fear, goals, baggage, or external constraints.",
      },
      {
        title: "Adhesion / Forced Proximity",
        description:
          "Circumstances keep them together, creating repeated interaction and vulnerability.",
      },
      {
        title: "Deepening Desire",
        description:
          "Intimacy grows through shared moments, trust, and emotional risk.",
      },
      {
        title: "Retreat and Doubt",
        description:
          "Fear and old wounds trigger hesitation; one or both pull back.",
      },
      {
        title: "Breakup / Crisis",
        description:
          "A rupture separates the couple and tests whether love can survive.",
      },
      {
        title: "Grand Gesture",
        description:
          "One or both choose love through meaningful action, apology, or sacrifice.",
      },
      {
        title: "Commitment / HEA-HFN",
        description:
          "Resolve the romance with committed partnership (Happy Ever After / Happy For Now).",
      },
    ],
  },
  mice_quotient: {
    id: "mice_quotient",
    name: "MICE Quotient",
    description:
      "Four thread types—Milieu (world), Idea (question), Character (inner change), Event (disruption)—each with an open and close. Helps diagnose what kind of story you are telling and avoid unsatisfying endings that resolve the wrong thread.",
    author: "Orson Scott Card (often cited from his writing essays and workshops).",
    phases: [
      {
        title: "Milieu Question Open",
        description:
          "Open the world thread by entering, discovering, or being displaced into a setting.",
      },
      {
        title: "Idea Question Open",
        description:
          "Introduce the mystery/problem that demands explanation.",
      },
      {
        title: "Character Question Open",
        description:
          "Set up an internal conflict the character must resolve to grow.",
      },
      {
        title: "Event Question Open",
        description:
          "Disrupt normal order with a change that creates immediate external stakes.",
      },
      {
        title: "Event Question Close",
        description:
          "Restore or redefine order by resolving the external disruption.",
      },
      {
        title: "Character Question Close",
        description:
          "Complete the internal arc by showing the character’s transformed choice or identity.",
      },
      {
        title: "Idea Question Close",
        description:
          "Answer the mystery/problem or accept the best available explanation.",
      },
      {
        title: "Milieu Question Close",
        description:
          "Close the world thread by leaving, returning, or integrating into the setting.",
      },
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
  { id: "subplot", label: "Subplot", color: "#d9f99d" },
  { id: "detail", label: "Detail", color: "#a5f3fc" },
  { id: "todo", label: "Todo", color: "#fed7aa" },
  { id: "other", label: "Other", color: "#e5e7eb" },
];
