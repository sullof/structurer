export function loadJsonItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJsonItem(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadBoards(storageKey) {
  const parsed = loadJsonItem(storageKey, null);
  if (parsed === null) return null;
  return Array.isArray(parsed) ? parsed : [];
}

export function saveBoards(storageKey, boards) {
  saveJsonItem(storageKey, boards);
}

export function loadSettings(settingsKey) {
  const parsed = loadJsonItem(settingsKey, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveSettings(settingsKey, settings) {
  saveJsonItem(settingsKey, settings);
}

export function loadCustomStructures(customStructuresKey) {
  const parsed = loadJsonItem(customStructuresKey, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item) => {
    if (!item || typeof item.id !== "string" || typeof item.name !== "string" || !Array.isArray(item.phases)) {
      return false;
    }
    if (item.isAlteredStructure === true) {
      return typeof item.ownerBoardUid === "string" && item.ownerBoardUid.length > 0;
    }
    return true;
  });
}

export function saveCustomStructures(customStructuresKey, customStructures) {
  saveJsonItem(customStructuresKey, customStructures);
}

export function loadCustomArchetypes(customArchetypesKey) {
  const parsed = loadJsonItem(customArchetypesKey, []);
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item) => item && typeof item.id === "string" && typeof item.label === "string" && typeof item.icon === "string",
  );
}

export function saveCustomArchetypes(customArchetypesKey, customArchetypes) {
  saveJsonItem(customArchetypesKey, customArchetypes);
}

export function clearKeys(keys) {
  keys.forEach((key) => localStorage.removeItem(key));
}

export function isFlagEnabled(flagKey) {
  return localStorage.getItem(flagKey) === "true";
}
