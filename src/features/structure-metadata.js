import { t } from "../i18n/index.js";

/** Max lengths and safety checks for structure-level metadata (not phase text). */

export const STRUCTURE_DESCRIPTION_MAX = 4000;
export const STRUCTURE_AUTHOR_MAX = 180;

const URLISH = /https?:\/\/|\/\/[^\s/]/i;
const SCHEME = /(javascript|data|vbscript):/i;
const HTML_INJECT = /<\s*(script|iframe|object|embed)|\bon\w+\s*=/i;

/**
 * Reject obvious links and executable payloads in user-supplied structure fields.
 */
export function validateStructureDescription(raw) {
  const s = String(raw ?? "").trim();
  if (s.length > STRUCTURE_DESCRIPTION_MAX) {
    return { ok: false, error: t("descriptionMustBeAt", { max: String(STRUCTURE_DESCRIPTION_MAX) }) };
  }
  if (URLISH.test(s)) {
    return { ok: false, error: t("descriptionCannotContainWeb") };
  }
  if (SCHEME.test(s)) {
    return { ok: false, error: t("descriptionCannotContainScript") };
  }
  if (HTML_INJECT.test(s)) {
    return { ok: false, error: t("descriptionCannotContainHtml") };
  }
  return { ok: true, value: s };
}

/**
 * Optional author: plain name, or exactly `Name <email@domain>`.
 */
export function validateStructureAuthor(raw) {
  const s = String(raw ?? "").trim();
  if (!s) {
    return { ok: true, value: "" };
  }
  if (s.length > STRUCTURE_AUTHOR_MAX) {
    return { ok: false, error: t("authorMustBeAt", { max: String(STRUCTURE_AUTHOR_MAX) }) };
  }
  if (URLISH.test(s) || SCHEME.test(s)) {
    return { ok: false, error: t("authorCannotContainWeb") };
  }
  if (HTML_INJECT.test(s)) {
    return { ok: false, error: t("authorCannotContainHtml") };
  }
  if (s.includes("<") || s.includes(">")) {
    const m = s.match(
      /^\s*([\s\S]+?)\s*<\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,})\s*>\s*$/,
    );
    if (!m) {
      return {
        ok: false,
        error: t("authorWithAnEmail"),
      };
    }
    const namePart = m[1].trim();
    const email = m[2].trim();
    if (!namePart) {
      return { ok: false, error: t("authorMustIncludeA") };
    }
    return { ok: true, value: `${namePart} <${email}>` };
  }
  return { ok: true, value: s };
}
