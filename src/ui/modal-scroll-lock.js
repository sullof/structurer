/**
 * While any `.modal-overlay` is visible, lock document scroll so touch drags on the dimmed
 * backdrop do not scroll the page underneath (common on mobile Safari / Chrome).
 */
let savedScrollY = 0;

function lock() {
  if (document.body.classList.contains("modal-scroll-locked")) return;
  savedScrollY = window.scrollY ?? document.documentElement.scrollTop ?? 0;
  document.body.style.top = `-${savedScrollY}px`;
  document.documentElement.classList.add("modal-scroll-locked");
  document.body.classList.add("modal-scroll-locked");
}

function unlock() {
  if (!document.body.classList.contains("modal-scroll-locked")) return;
  document.documentElement.classList.remove("modal-scroll-locked");
  document.body.classList.remove("modal-scroll-locked");
  document.body.style.top = "";
  window.scrollTo(0, savedScrollY);
}

function syncModalScrollLock() {
  const anyOpen = document.querySelector(".modal-overlay:not(.hidden)");
  if (anyOpen) lock();
  else unlock();
}

export function initModalScrollLock() {
  const observer = new MutationObserver((mutations) => {
    const relevant = mutations.some(
      (m) => m.target instanceof HTMLElement && m.target.classList?.contains("modal-overlay"),
    );
    if (relevant) syncModalScrollLock();
  });
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  });
  syncModalScrollLock();
}
