function pathLooksLikeSharedStructurerLink(pathname) {
  if (pathname === "/group") return false;
  if (pathname.startsWith("/group/")) {
    return pathname.slice("/group/".length).length > 0;
  }
  if (/^\/[^/]+\/phase\/\d+$/.test(pathname)) {
    return true;
  }
  const segment = pathname.slice(1);
  if (!segment || segment.includes("/")) return false;
  return /^[a-z0-9][a-z0-9_]*$/i.test(segment) && segment.length <= 200;
}

export function createNavigationController({
  views,
  homeRoute,
  getBoards,
  getGroups,
  getStructureConfig,
  getCurrentBoardId,
  setCurrentBoardId,
  setCurrentGroupId,
  setBoardBackGroupId,
  clearEditingNoteId,
  renderHome,
  renderEditor,
  renderGroup,
  renderPhaseDetail,
  applyColumnWidth,
  applyWrapColumns,
}) {
  const {
    landingView,
    homeView,
    groupView,
    editorView,
    phaseView,
    helpView,
    privacyView,
    termsView,
    aiAnalysisPromptView,
    notFoundView,
  } = views;

  function normalizePathname(pathname) {
    if (!pathname || pathname === "/") return "/";
    return pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  }

  function navigateTo(path, replace = false) {
    const target = normalizePathname(path);
    const current = normalizePathname(window.location.pathname);
    if (target === current) return;
    if (replace) {
      window.history.replaceState({}, "", target);
      return;
    }
    window.history.pushState({}, "", target);
  }

  function showHome() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.remove("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    renderHome();
  }

  function showLanding() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.remove("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
  }

  function showHelp() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.remove("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
  }

  function showPrivacy() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    privacyView.classList.remove("hidden");
  }

  function showTerms() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    termsView.classList.remove("hidden");
  }

  function showAiAnalysisPrompt() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.remove("hidden");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function showBoard(boardId) {
    const board = getBoards().find((item) => item.id === boardId);
    if (!board) {
      showHome();
      return;
    }
    setCurrentBoardId(boardId);
    clearEditingNoteId();
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.remove("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    renderEditor();
    applyColumnWidth();
    applyWrapColumns();
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function showBoardPhase(boardId, phaseIndex) {
    const board = getBoards().find((item) => item.id === boardId);
    if (!board) {
      showHome();
      return;
    }
    const phaseCount = getStructureConfig(board.structureId).phases.length;
    if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= phaseCount) {
      showBoard(boardId);
      return;
    }
    setCurrentBoardId(boardId);
    clearEditingNoteId();
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.remove("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    if (typeof renderPhaseDetail === "function") {
      renderPhaseDetail(board.id, phaseIndex);
    }
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function showGroup(groupId) {
    const group = getGroups().find((item) => item.id === groupId);
    if (!group) {
      showHome();
      return;
    }
    setCurrentGroupId(groupId);
    setCurrentBoardId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.remove("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    if (notFoundView) notFoundView.classList.add("hidden");
    renderGroup();
  }

  function showNotFound(variant) {
    if (!notFoundView) {
      openLanding();
      return;
    }
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.add("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
    if (phaseView) phaseView.classList.add("hidden");
    helpView.classList.add("hidden");
    if (privacyView) privacyView.classList.add("hidden");
    if (termsView) termsView.classList.add("hidden");
    if (aiAnalysisPromptView) aiAnalysisPromptView.classList.add("hidden");
    const genericPanel = notFoundView.querySelector('[data-not-found-panel="generic"]');
    const sharingPanel = notFoundView.querySelector('[data-not-found-panel="sharing"]');
    if (genericPanel && sharingPanel) {
      if (variant === "sharing") {
        genericPanel.classList.add("hidden");
        sharingPanel.classList.remove("hidden");
      } else {
        sharingPanel.classList.add("hidden");
        genericPanel.classList.remove("hidden");
      }
    }
    notFoundView.classList.remove("hidden");
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    });
  }

  function openBoard(boardId, replaceRoute = false, fromGroupId = null) {
    const board = getBoards().find((item) => item.id === boardId);
    if (!board) return;
    setBoardBackGroupId(fromGroupId);
    const path = `/${board.slug}`;
    navigateTo(path, replaceRoute);
    showBoard(board.id);
  }

  function openBoardPhase(boardId, phaseIndex, replaceRoute = false, fromGroupId = null) {
    const board = getBoards().find((item) => item.id === boardId);
    if (!board) return;
    const phaseCount = getStructureConfig(board.structureId).phases.length;
    if (!Number.isInteger(phaseIndex) || phaseIndex < 0 || phaseIndex >= phaseCount) {
      openBoard(board.id, replaceRoute, fromGroupId);
      return;
    }
    setBoardBackGroupId(fromGroupId);
    const path = `/${board.slug}/phase/${phaseIndex + 1}`;
    navigateTo(path, replaceRoute);
    showBoardPhase(board.id, phaseIndex);
  }

  function openHome(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo(homeRoute, replaceRoute);
    showHome();
  }

  function openLanding(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo("/", replaceRoute);
    showLanding();
  }

  function openGroup(groupId, replaceRoute = false) {
    const group = getGroups().find((item) => item.id === groupId);
    if (!group) return;
    setBoardBackGroupId(null);
    const path = `/group/${group.slug}`;
    navigateTo(path, replaceRoute);
    showGroup(group.id);
  }

  function openHelp(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo("/help", replaceRoute);
    showHelp();
  }

  function openPrivacy(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo("/privacy", replaceRoute);
    showPrivacy();
  }

  function openTerms(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo("/terms", replaceRoute);
    showTerms();
  }

  function openAiAnalysisPrompt(replaceRoute = false) {
    setBoardBackGroupId(null);
    navigateTo("/build-analysis-prompt", replaceRoute);
    showAiAnalysisPrompt();
  }

  function syncRouteToState(replaceRoute = true) {
    const path = normalizePathname(window.location.pathname);
    if (path === "/") {
      showLanding();
      return;
    }
    if (path === homeRoute) {
      showHome();
      return;
    }
    if (path === "/help") {
      showHelp();
      return;
    }
    if (path === "/privacy") {
      showPrivacy();
      return;
    }
    if (path === "/terms") {
      showTerms();
      return;
    }
    if (path === "/build-analysis-prompt") {
      showAiAnalysisPrompt();
      return;
    }
    if (path === "/group") {
      showNotFound("generic");
      return;
    }
    if (path.startsWith("/group/")) {
      const slug = path.slice("/group/".length);
      const group = getGroups().find((item) => item.slug === slug);
      if (!group) {
        showNotFound("sharing");
        return;
      }
      showGroup(group.id);
      return;
    }
    const phaseRouteMatch = path.match(/^\/([^/]+)\/phase\/(\d+)$/);
    if (phaseRouteMatch) {
      const [, slug, phaseIndexRaw] = phaseRouteMatch;
      const board = getBoards().find((item) => item.slug === slug);
      const oneBasedIndex = Number(phaseIndexRaw);
      if (!board || !Number.isInteger(oneBasedIndex)) {
        showNotFound("sharing");
        return;
      }
      const phaseCount = getStructureConfig(board.structureId).phases.length;
      const phaseIndex = oneBasedIndex - 1;
      if (phaseIndex < 0 || phaseIndex >= phaseCount) {
        openBoard(board.id, true);
        return;
      }
      setBoardBackGroupId(null);
      showBoardPhase(board.id, phaseIndex);
      return;
    }
    const slug = path.slice(1);
    const board = getBoards().find((item) => item.slug === slug);
    if (!board) {
      const variant = pathLooksLikeSharedStructurerLink(path) ? "sharing" : "generic";
      showNotFound(variant);
      return;
    }
    setBoardBackGroupId(null);
    showBoard(board.id);
  }

  return {
    showHome,
    showLanding,
    showHelp,
    showPrivacy,
    showTerms,
    showBoard,
    showBoardPhase,
    showGroup,
    openBoard,
    openBoardPhase,
    openHome,
    openLanding,
    openHelp,
    openPrivacy,
    openTerms,
    openGroup,
    openAiAnalysisPrompt,
    showAiAnalysisPrompt,
    showNotFound,
    syncRouteToState,
  };
}
