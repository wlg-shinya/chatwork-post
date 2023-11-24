import { LocalStorage } from "./local-storage";
import { DataSignIn, DataSignInBlank } from "./data-signin";

function isBlank(object: object): boolean {
  return Object.keys(object).length === 0;
}

type Data = DataSignIn;
export const AppLocalStorage = {
  fetch<T extends Data>(): T {
    const data = LocalStorage.fetch("signin");
    return (isBlank(data) ? DataSignInBlank : data) as T;
  },
  save<T extends Data>(data: T) {
    LocalStorage.save(data, "signin");
  },
};
