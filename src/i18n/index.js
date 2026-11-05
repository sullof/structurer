import { BUILTIN_STRUCTURES } from "../app-config.js";
import { structurePacks } from "./structures.js";
import { uiEn } from "./ui.en.js";
import { uiEs } from "./ui.es.js";
import { uiIt } from "./ui.it.js";

const LOCALE_KEY = "structurer.locale";
export const SUPPORTED_LOCALES = ["en", "it", "es"];

const DOC = {
  en: {
    title: "Structurer - Story Structure Boards",
    description:
      "Structurer is a private, browser-based story planning app with visual structure boards, JSON import/export, and read-only shared link previews.",
  },
  it: {
    title: "Structurer - Mappe per la struttura delle storie",
    description:
      "Structurer è un’app privata nel browser per progettare storie, con bacheche visive, importazione ed esportazione JSON e anteprime in sola lettura.",
  },
  es: {
    title: "Structurer - Tableros de estructura narrativa",
    description:
      "Structurer es una app privada en el navegador para planear historias, con tableros visuales, importación y exportación JSON y vistas de solo lectura.",
  },
};

const NOTE_LABELS = {
  en: {
    plot: "Plot",
    character: "Character",
    theme: "Theme",
    subplot: "Subplot",
    detail: "Detail",
    flashback: "Flashback",
    time: "Time",
    topic: "Topic",
    question: "Question",
    reference: "Reference",
    todo: "Todo",
    location: "Location",
    milestone: "Milestone",
    absence: "Absence",
  },
  it: {
    plot: "Trama",
    character: "Personaggio",
    theme: "Tema",
    subplot: "Sottotrama",
    detail: "Dettaglio",
    flashback: "Flashback",
    time: "Tempo",
    topic: "Argomento",
    question: "Domanda",
    reference: "Riferimento",
    todo: "Da fare",
    location: "Luogo",
    milestone: "Tappa",
    absence: "Assenza",
  },
  es: {
    plot: "Trama",
    character: "Personaje",
    theme: "Tema",
    subplot: "Subtrama",
    detail: "Detalle",
    flashback: "Flashback",
    time: "Tiempo",
    topic: "Asunto",
    question: "Pregunta",
    reference: "Referencia",
    todo: "Pendiente",
    location: "Lugar",
    milestone: "Hito",
    absence: "Ausencia",
  },
};

const ARCHETYPE_LABELS = {
  en: {
    none: "No specific role",
    hero: "Hero",
    mentor: "Mentor",
    ally: "Ally",
    herald: "Herald",
    guardian: "Threshold Guardian",
    shadow: "Shadow/Antagonist",
    trickster: "Trickster",
    shapeshifter: "Shapeshifter",
  },
  it: {
    none: "Nessun ruolo specifico",
    hero: "Eroe",
    mentor: "Mentore",
    ally: "Alleato",
    herald: "Araldo",
    guardian: "Guardiano della soglia",
    shadow: "Ombra/Antagonista",
    trickster: "Imbroglione",
    shapeshifter: "Mutaforma",
  },
  es: {
    none: "Sin rol específico",
    hero: "Héroe",
    mentor: "Mentor",
    ally: "Aliado",
    herald: "Heraldo",
    guardian: "Guardián del umbral",
    shadow: "Sombra/Antagonista",
    trickster: "Embaucador",
    shapeshifter: "Cambiaformas",
  },
};

const textNodes = [];
const attributes = [];
const listeners = new Set();
let locale = "en";
let dict = {};

const sourceToKey = new Map(
  Object.entries(uiEn).map(([id, english]) => [normKey(english), id]),
);

function messageId(message) {
  const source = String(message ?? "");
  if (Object.prototype.hasOwnProperty.call(dict, source)) return source;
  return sourceToKey.get(normKey(source)) || "";
}

export function normKey(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function getLocale() {
  return locale;
}

export function localeTag() {
  return locale;
}

export function t(message, vars) {
  const source = String(message ?? "");
  const id = messageId(source);
  let out = id && Object.prototype.hasOwnProperty.call(dict, id) ? dict[id] : source;
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (_, name) => (vars[name] == null ? "" : String(vars[name])));
  }
  return out;
}

export function tCount(n, oneKey, manyKey) {
  const count = Number(n) || 0;
  return t(count === 1 ? oneKey : manyKey, { n: String(count) });
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function dictionaries() {
  return { en: uiEn, it: uiIt, es: uiEs };
}

function detectLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // Ignore private-mode storage failures and fall through to the browser language.
  }
  const nav = String(navigator.language || "en").toLowerCase();
  if (nav.startsWith("it")) return "it";
  if (nav.startsWith("es")) return "es";
  return "en";
}

function shouldSkip(el) {
  return Boolean(el?.closest?.("[data-i18n-skip], textarea, script, style, noscript"));
}

function indexStaticCopy(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    const parent = node.parentElement;
    if (parent && !shouldSkip(parent) && normKey(node.nodeValue)) {
      textNodes.push({ node, original: node.nodeValue });
    }
    node = walker.nextNode();
  }
  root.querySelectorAll("[placeholder], [aria-label], [title]").forEach((el) => {
    if (shouldSkip(el)) return;
    for (const attr of ["placeholder", "aria-label", "title"]) {
      if (!el.hasAttribute(attr)) continue;
      const original = el.getAttribute(attr);
      if (!normKey(original)) continue;
      attributes.push({ el, attr, original });
    }
  });
}

function applyStaticCopy() {
  for (const item of textNodes) {
    if (!item.node.isConnected) continue;
    const id = sourceToKey.get(normKey(item.original));
    const translated = id && Object.prototype.hasOwnProperty.call(dict, id) ? dict[id] : "";
    if (!translated) {
      item.node.nodeValue = item.original;
      continue;
    }
    const lead = item.original.match(/^\s*/)[0];
    const trail = item.original.match(/\s*$/)[0];
    item.node.nodeValue = `${lead}${translated}${trail}`;
  }
  for (const item of attributes) {
    if (!item.el.isConnected) continue;
    const id = sourceToKey.get(normKey(item.original));
    const translated = id && Object.prototype.hasOwnProperty.call(dict, id) ? dict[id] : "";
    item.el.setAttribute(item.attr, translated || item.original);
  }
}

function applyDocumentMeta() {
  const pack = DOC[locale];
  if (!pack) return;
  document.documentElement.lang = locale;
  document.title = pack.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", pack.description);
  document.querySelectorAll(".app-footer-locale-choice").forEach((button) => {
    const active = button.dataset.locale === locale;
    button.disabled = active;
    button.setAttribute("aria-current", active ? "true" : "false");
  });
}

export function applyTranslations() {
  dict = dictionaries()[locale] || {};
  applyStaticCopy();
  applyDocumentMeta();
}

export function setLocale(next) {
  const value = SUPPORTED_LOCALES.includes(next) ? next : "en";
  locale = value;
  try {
    localStorage.setItem(LOCALE_KEY, value);
  } catch {
    // The choice still applies for this page load.
  }
  applyTranslations();
  listeners.forEach((fn) => fn(locale));
  document.dispatchEvent(new CustomEvent("structurer:locale"));
}

export function initI18n() {
  locale = detectLocale();
  if (textNodes.length === 0 && attributes.length === 0) {
    indexStaticCopy(document.documentElement);
  }
  applyTranslations();
  const choices = document.querySelector(".app-footer-locale-choices");
  if (choices && choices.dataset.bound !== "1") {
    choices.dataset.bound = "1";
    choices.addEventListener("click", (event) => {
      const button = event.target.closest(".app-footer-locale-choice");
      if (!button || button.disabled) return;
      setLocale(button.dataset.locale);
    });
  }
}

export function displayNoteType(type) {
  if (!type) return type;
  const label = NOTE_LABELS[locale]?.[type.id];
  if (!label) return type;
  return { ...type, label };
}

export function displayArchetype(archetype) {
  if (!archetype) return archetype;
  const label = ARCHETYPE_LABELS[locale]?.[archetype.id];
  if (!label) return archetype;
  return { ...archetype, label };
}

export function localizeStructureForDisplay(structure) {
  if (!structure || structure.isAlteredStructure) return structure;
  if (!Object.prototype.hasOwnProperty.call(BUILTIN_STRUCTURES, structure.id)) return structure;
  const pack = structurePacks[locale]?.[structure.id];
  if (!pack) return structure;
  const phases = Array.isArray(structure.phases) ? structure.phases : [];
  return {
    ...structure,
    name: pack.name || structure.name,
    description: pack.description || structure.description,
    author: pack.author || structure.author,
    phases: phases.map((phase, index) => {
      const translated = pack.phases?.[index];
      if (!translated) return phase;
      if (typeof phase === "string") {
        return { title: translated.title || phase, description: translated.description };
      }
      return {
        ...phase,
        title: translated.title || phase.title,
        description: translated.description || phase.description,
      };
    }),
  };
}
