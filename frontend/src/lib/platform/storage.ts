export interface KeyValueStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/**
 * Web key-value store backed by `localStorage`, guarded against private-mode
 * throws. Works unchanged inside the Capacitor and Tauri WebViews too. If a
 * native-backed store is ever needed (e.g. `@capacitor/preferences`), swap the
 * implementation here — callers depend only on {@link KeyValueStore}.
 */
export const storage: KeyValueStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // localStorage indisponivel (ex.: modo privado) - segue sem persistir.
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
