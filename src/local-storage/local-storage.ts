const STORAGE_KEY = import.meta.env.VITE_STORAGE_KEY;

export const LocalStorage = {
  fetch(key: string): object {
    const d = fetch();
    if (typeof d[key] === "undefined") {
      d[key] = {};
    }
    return d[key];
  },
  save(data: object, key: string) {
    const d = fetch();
    d[key] = data;
    save(d);
  },
};

function fetch(): any {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
}
function save(data: object) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
