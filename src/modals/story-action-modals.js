export async function promptStoryExportOptions({
  board,
  boardHasAnyPhaseComments,
  appDialog,
}) {
  const hasPhaseComments = boardHasAnyPhaseComments(board);
  if (!hasPhaseComments) {
    return { includePhaseComments: true };
  }
  const result = await appDialog({
    title: "Export the story",
    message: "",
    confirmLabel: "Export",
    render(root, api) {
      root.innerHTML = `
        <p class="subtitle" style="margin-top:0;line-height:1.45;">
          Choose what to include in the exported story JSON.
        </p>
        <label class="factory-reset-confirm-checkbox" style="margin-top:14px;">
          <input type="checkbox" id="story-export-include-comments" checked />
          <span>Export phase comments too</span>
        </label>
      `;
      const checkbox = root.querySelector("#story-export-include-comments");
      api.setConfirmEnabled(true);
      return () => ({
        includePhaseComments: checkbox ? Boolean(checkbox.checked) : true,
      });
    },
  });
  if (!result || typeof result !== "object") return null;
  return {
    includePhaseComments: result.includePhaseComments !== false,
  };
}

export async function promptStorySlugOptions({
  board,
  appDialog,
  slugifyTitle,
  escapeHtml,
}) {
  const currentSlug =
    typeof board.slug === "string" && board.slug.trim() ? board.slug.trim() : slugifyTitle(board.title || "story");
  const result = await appDialog({
    title: "Change story URL",
    message: "",
    confirmLabel: "Save",
    render(root, api) {
      root.innerHTML = `
        <p class="subtitle" style="margin-top:0;line-height:1.45;">
          Set the URL slug for this story. Exported filename follows this slug too.
        </p>
        <p class="subtitle" style="margin-top:8px;line-height:1.45;">
          Allowed characters: letters (<code>a-z</code>), numbers (<code>0-9</code>) and underscore (<code>_</code>).
          Other characters are ignored. Spaces and separators become <code>_</code>.
        </p>
        <p id="story-slug-preview" style="margin:10px 0 8px 0;line-height:1.35;color:#111827;font-weight:600;"></p>
        <label class="app-dialog-field-label" for="story-slug-input">Story URL slug</label>
        <input
          id="story-slug-input"
          class="app-dialog-input"
          type="text"
          maxlength="200"
          value="${escapeHtml(currentSlug)}"
          style="width:100%;box-sizing:border-box;font:inherit;padding:10px 12px;"
        />
      `;
      const input = root.querySelector("#story-slug-input");
      const preview = root.querySelector("#story-slug-preview");
      const normalizeLiveSlug = (value) => slugifyTitle(String(value || ""));
      const sync = () => {
        const raw = String(input?.value || "");
        const normalized = normalizeLiveSlug(raw);
        api.setConfirmEnabled(normalized.length > 0);
        if (preview) preview.textContent = `URL preview: /${normalized}`;
      };
      if (input) {
        input.addEventListener("input", sync);
        requestAnimationFrame(() => {
          input.focus();
          input.select();
        });
      }
      sync();
      return () => {
        const normalized = normalizeLiveSlug(input?.value || "");
        if (!normalized) return null;
        return { baseSlug: normalized };
      };
    },
  });
  if (!result || typeof result !== "object") return null;
  const baseSlug = String(result.baseSlug || "").trim();
  if (!baseSlug) return null;
  return { baseSlug };
}
