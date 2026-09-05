export function readKfeShellSelection(key) {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function persistKfeShellSelection(key, name) {
  try {
    globalThis.localStorage?.setItem(key, name);
  } catch {
    // Selection remains valid for this runtime when storage is unavailable.
  }
  return name;
}
