function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;");
}

function labelClassByVariant(variant) {
  if (variant === "demo") return "demo-label";
  if (variant === "analysis" || variant === "shared") return "analysis-label";
  return "";
}

/**
 * Reusable title-line component: optional badge + title HTML.
 * `titleHtml` is expected to be safe markup built by callers.
 */
export function titleLineTemplate({
  titleHtml = "",
  labelText = "",
  labelVariant = "",
  labelExtraClass = "",
  titleClass = "",
  labelPosition = "left",
}) {
  const baseLabelClass = labelClassByVariant(labelVariant);
  const mergedLabelClass = [baseLabelClass, labelExtraClass].filter(Boolean).join(" ").trim();
  const labelMarkup = labelText ? `<span class="${escapeHtml(mergedLabelClass)}">${escapeHtml(labelText)}</span>` : "";
  const titleMarkup = titleClass
    ? `<span class="${escapeHtml(titleClass)}">${titleHtml}</span>`
    : titleHtml;
  if (!labelMarkup) return `${titleMarkup}`;
  if (labelPosition === "right") return `${titleMarkup} ${labelMarkup}`;
  return `${labelMarkup} ${titleMarkup}`;
}
