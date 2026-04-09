/**
 * In-app dialogs replacing window.alert / window.confirm, plus generic `appDialog` for custom body content.
 *
 * - `await appAlert("Message")` -> Promise<void>
 * - `await appAlert("Message", { confirm: true })` -> Promise<boolean>
 * - `await appDialog({ title, message, render, ... })` -> Promise<T | null> (null = cancel / dismiss)
 */

const queue = [];
let isOpen = false;
let currentResolve = null;
/** @type {'none' | 'message' | 'confirm' | 'custom'} */
let currentMode = "none";
/** @type {null | (() => unknown)} */
let currentGetValue = null;
let listenersAttached = false;

function getElements() {
  return {
    overlay: document.querySelector("#app-alert-modal-overlay"),
    titleEl: document.querySelector("#app-alert-title"),
    messageEl: document.querySelector("#app-alert-message"),
    customRoot: document.querySelector("#app-alert-custom-root"),
    okBtn: document.querySelector("#app-alert-ok"),
    cancelBtn: document.querySelector("#app-alert-cancel"),
    confirmBtn: document.querySelector("#app-alert-confirm"),
  };
}

function clearCustomRoot() {
  const { customRoot } = getElements();
  if (!customRoot) return;
  customRoot.innerHTML = "";
  customRoot.classList.add("hidden");
}

/**
 * @param {unknown} [result] - confirm: boolean; custom: payload or null when cancelling
 */
function completeDialog(result) {
  const { overlay } = getElements();
  if (overlay) overlay.classList.add("hidden");
  const resolve = currentResolve;
  const mode = currentMode;
  currentResolve = null;
  currentMode = "none";
  currentGetValue = null;
  isOpen = false;
  clearCustomRoot();
  if (resolve) {
    if (mode === "message") {
      resolve();
    } else if (mode === "confirm") {
      resolve(result === true);
    } else if (mode === "custom") {
      resolve(result);
    }
  }
  processQueue();
}

function processQueue() {
  if (isOpen || queue.length === 0) return;
  const item = queue.shift();
  const { overlay, titleEl, messageEl, customRoot, okBtn, cancelBtn, confirmBtn } = getElements();

  if (!overlay || !messageEl || !okBtn) {
    fallbackNative(item);
    processQueue();
    return;
  }

  if (item.mode === "confirm" && (!cancelBtn || !confirmBtn)) {
    fallbackNative(item);
    processQueue();
    return;
  }

  if (item.mode === "custom" && (!cancelBtn || !confirmBtn || !customRoot)) {
    fallbackNative(item);
    processQueue();
    return;
  }

  ensureListeners();
  currentResolve = item.resolve;
  isOpen = true;

  if (item.mode === "message" || item.mode === "confirm") {
    clearCustomRoot();
    messageEl.classList.remove("hidden");
    messageEl.textContent = item.message;
    if (titleEl) titleEl.textContent = item.mode === "confirm" ? "Confirm" : "Notice";

    if (item.mode === "message") {
      currentMode = "message";
      okBtn.classList.remove("hidden");
      cancelBtn.classList.add("hidden");
      confirmBtn.classList.add("hidden");
      okBtn.focus();
    } else {
      currentMode = "confirm";
      okBtn.classList.add("hidden");
      cancelBtn.classList.remove("hidden");
      confirmBtn.classList.remove("hidden");
      confirmBtn.disabled = false;
      confirmBtn.textContent = "Confirm";
      cancelBtn.textContent = "Cancel";
      cancelBtn.focus();
    }
  } else if (item.mode === "custom") {
    currentMode = "custom";
    messageEl.textContent = item.message || "";
    messageEl.classList.toggle("hidden", !item.message);
    if (titleEl) titleEl.textContent = item.title || "Notice";

    customRoot.innerHTML = "";
    customRoot.classList.remove("hidden");

    okBtn.classList.add("hidden");
    cancelBtn.classList.remove("hidden");
    confirmBtn.classList.remove("hidden");
    confirmBtn.textContent = item.confirmLabel || "Confirm";
    cancelBtn.textContent = item.cancelLabel || "Cancel";
    confirmBtn.disabled = true;

    const api = {
      setConfirmEnabled: (enabled) => {
        confirmBtn.disabled = !enabled;
      },
    };

    let getter = () => null;
    try {
      const returned = item.render(customRoot, api);
      if (typeof returned === "function") {
        getter = returned;
      }
    } catch (error) {
      console.error(error);
      completeDialog(null);
      return;
    }
    currentGetValue = getter;
    cancelBtn.focus();
  }

  overlay.classList.remove("hidden");
}

function fallbackNative(item) {
  if (item.mode === "custom") {
    item.resolve(null);
    return;
  }
  if (item.mode === "confirm") {
    item.resolve(window.confirm(item.message));
    return;
  }
  window.alert(item.message);
  item.resolve();
}

function ensureListeners() {
  if (listenersAttached) return;
  const { overlay, okBtn, cancelBtn, confirmBtn } = getElements();
  if (!overlay || !okBtn || !cancelBtn || !confirmBtn) return;

  okBtn.addEventListener("click", () => {
    if (!isOpen) return;
    if (currentMode !== "message") return;
    completeDialog();
  });

  cancelBtn.addEventListener("click", () => {
    if (!isOpen) return;
    if (currentMode === "confirm") completeDialog(false);
    else if (currentMode === "custom") completeDialog(null);
  });

  confirmBtn.addEventListener("click", () => {
    if (!isOpen) return;
    if (currentMode === "confirm") {
      completeDialog(true);
      return;
    }
    if (currentMode === "custom" && currentGetValue) {
      const value = currentGetValue();
      if (value === undefined || value === null) return;
      completeDialog(value);
    }
  });

  overlay.addEventListener("click", (event) => {
    if (event.target !== overlay || !isOpen) return;
    if (currentMode === "message") completeDialog();
    else if (currentMode === "confirm") completeDialog(false);
    else if (currentMode === "custom") completeDialog(null);
  });

  listenersAttached = true;
}

/**
 * @param {string} message
 * @param {{ confirm?: boolean }} [options]
 * @returns {Promise<void | boolean>}
 */
export function appAlert(message, options = {}) {
  const isConfirm = options.confirm === true;
  return new Promise((resolve) => {
    queue.push({
      mode: isConfirm ? "confirm" : "message",
      message: String(message ?? ""),
      resolve,
    });
    processQueue();
  });
}

/**
 * Generic modal with a custom body built by `render`.
 *
 * @param {{
 *   title?: string,
 *   message?: string,
 *   render: (root: HTMLElement, api: { setConfirmEnabled: (enabled: boolean) => void }) => (() => unknown) | void,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 * }} options
 * @returns {Promise<unknown | null>} `null` when the user cancels or dismisses without confirming
 */
export function appDialog(options) {
  const {
    title = "Notice",
    message = "",
    render,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
  } = options;
  if (typeof render !== "function") {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    queue.push({
      mode: "custom",
      title,
      message,
      render,
      confirmLabel,
      cancelLabel,
      resolve,
    });
    processQueue();
  });
}

/** Escape: same as overlay dismiss */
export function closeAppAlertIfOpen() {
  if (!isOpen) return false;
  if (currentMode === "message") completeDialog();
  else if (currentMode === "confirm") completeDialog(false);
  else if (currentMode === "custom") completeDialog(null);
  return true;
}

export function dismissAllAppAlerts() {
  while (queue.length > 0) {
    const item = queue.shift();
    if (item.mode === "confirm") {
      item.resolve(false);
    } else if (item.mode === "custom") {
      item.resolve(null);
    } else {
      item.resolve();
    }
  }
  if (!isOpen) return;
  const { overlay } = getElements();
  if (overlay) overlay.classList.add("hidden");
  const resolve = currentResolve;
  const mode = currentMode;
  currentResolve = null;
  currentMode = "none";
  currentGetValue = null;
  isOpen = false;
  clearCustomRoot();
  if (resolve) {
    if (mode === "confirm") resolve(false);
    else if (mode === "custom") resolve(null);
    else resolve();
  }
}
