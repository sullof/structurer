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
    return { ok: false, error: `Description must be at most ${STRUCTURE_DESCRIPTION_MAX} characters.` };
  }
  if (URLISH.test(s)) {
    return { ok: false, error: "Description cannot contain web addresses (http/https or //)." };
  }
  if (SCHEME.test(s)) {
    return { ok: false, error: "Description cannot contain script or data URLs." };
  }
  if (HTML_INJECT.test(s)) {
    return { ok: false, error: "Description cannot contain HTML tags or inline handlers." };
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
    return { ok: false, error: `Author must be at most ${STRUCTURE_AUTHOR_MAX} characters.` };
  }
  if (URLISH.test(s) || SCHEME.test(s)) {
    return { ok: false, error: "Author cannot contain web addresses." };
  }
  if (HTML_INJECT.test(s)) {
    return { ok: false, error: "Author cannot contain HTML tags or inline handlers." };
  }
  if (s.includes("<") || s.includes(">")) {
    const m = s.match(
      /^\s*([\s\S]+?)\s*<\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,})\s*>\s*$/,
    );
    if (!m) {
      return {
        ok: false,
        error: 'Author with an email must use the form: Display Name <name@domain.com> (one pair of angle brackets only).',
      };
    }
    const namePart = m[1].trim();
    const email = m[2].trim();
    if (!namePart) {
      return { ok: false, error: "Author must include a name before the email in angle brackets." };
    }
    return { ok: true, value: `${namePart} <${email}>` };
  }
  return { ok: true, value: s };
}
