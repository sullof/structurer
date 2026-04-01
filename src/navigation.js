export function createNavigationController({
  views,
  homeRoute,
  getBoards,
  getGroups,
  getCurrentBoardId,
  setCurrentBoardId,
  setCurrentGroupId,
  setBoardBackGroupId,
  clearEditingNoteId,
  renderHome,
  renderEditor,
  renderGroup,
  renderInsights,
  applyColumnWidth,
  applyWrapColumns,
}) {
  const { landingView, homeView, groupView, editorView } = views;

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
    renderHome();
  }

  function showLanding() {
    setCurrentBoardId(null);
    setCurrentGroupId(null);
    landingView.classList.remove("hidden");
    homeView.classList.add("hidden");
    groupView.classList.add("hidden");
    editorView.classList.add("hidden");
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
    renderEditor();
    renderInsights(null);
    applyColumnWidth();
    applyWrapColumns();
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
    renderGroup();
  }

  function openBoard(boardId, replaceRoute = false, fromGroupId = null) {
    const board = getBoards().find((item) => item.id === boardId);
    if (!board) return;
    setBoardBackGroupId(fromGroupId);
    const path = `/${board.slug}`;
    navigateTo(path, replaceRoute);
    showBoard(board.id);
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
    if (path.startsWith("/group/")) {
      const slug = path.slice("/group/".length);
      const group = getGroups().find((item) => item.slug === slug);
      if (!group) {
        openHome(replaceRoute);
        return;
      }
      showGroup(group.id);
      return;
    }
    const slug = path.slice(1);
    const board = getBoards().find((item) => item.slug === slug);
    if (!board) {
      openLanding(replaceRoute);
      return;
    }
    setBoardBackGroupId(null);
    showBoard(board.id);
  }

  return { showHome, showLanding, showBoard, showGroup, openBoard, openHome, openLanding, openGroup, syncRouteToState };
}
