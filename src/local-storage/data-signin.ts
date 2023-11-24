export interface DataSignIn {
  apiToken: string;
  autoSignIn: boolean;
}

export const DataSignInBlank: DataSignIn = {
  apiToken: "",
  autoSignIn: false,
};
