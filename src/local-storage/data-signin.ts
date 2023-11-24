export interface DataSignIn {
  apiToken: string;
  isSavedApiToken: boolean;
  autoSignIn: boolean;
}

export const DataSignInDefault: DataSignIn = {
  apiToken: "",
  isSavedApiToken: false,
  autoSignIn: false,
};
