export class GenericStringStorage {
  private storage: Map<string, string> = new Map();

  get(key: string): string | null {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return this.storage.get(key) || null;
  }

  set(key: string, value: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      this.storage.set(key, value);
    }
  }

  remove(key: string): void {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      this.storage.delete(key);
    }
  }
}


