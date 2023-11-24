import { LocalStorage } from "./local-storage";

interface SignInData {
  apiToken: string;
  isSavedApiToken: boolean;
  autoSignIn: boolean;
}

class SignIn {
  defaultData: SignInData = {
    apiToken: "",
    isSavedApiToken: false,
    autoSignIn: false,
  };
  fetch(): SignInData {
    const data = LocalStorage.fetch(SignIn.name);
    return Object.keys(data).length ? (data as SignInData) : this.defaultData;
  }
  save(data: SignInData) {
    LocalStorage.save(data, SignIn.name);
  }
}

export default new SignIn();
