export function createDashboardActionsModalController() {
  const overlayEl = document.querySelector("#dashboard-actions-modal-overlay");
  const sectionsRootEl = document.querySelector(".dashboard-actions-modal-sections");
  const closeBtnEl = document.querySelector("#close-dashboard-actions-modal");

  function close() {
    if (!overlayEl) return;
    overlayEl.classList.add("hidden");
    if (sectionsRootEl) {
      sectionsRootEl.querySelectorAll("details.dashboard-actions-section").forEach((details) => {
        details.open = false;
      });
    }
  }

  function open() {
    if (!overlayEl) return;
    overlayEl.classList.remove("hidden");
  }

  function isOpen() {
    return Boolean(overlayEl && !overlayEl.classList.contains("hidden"));
  }

  function initExclusiveAccordion() {
    if (!sectionsRootEl) return;
    sectionsRootEl.addEventListener("toggle", (event) => {
      const details = event.target;
      if (!(details instanceof HTMLDetailsElement) || !details.matches(".dashboard-actions-section")) return;
      if (!details.open) return;
      sectionsRootEl.querySelectorAll("details.dashboard-actions-section").forEach((other) => {
        if (other !== details) other.open = false;
      });
    });
  }

  function init() {
    initExclusiveAccordion();
    if (closeBtnEl) {
      closeBtnEl.addEventListener("click", () => {
        close();
      });
    }
    if (overlayEl) {
      overlayEl.addEventListener("click", (event) => {
        if (event.target === overlayEl) close();
      });
    }
  }

  return {
    open,
    close,
    isOpen,
    init,
  };
}
