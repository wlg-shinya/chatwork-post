export interface RegisteredData extends RegisteredDataUserInput {
  id: number;
}

export interface RegisteredDataUserInput {
  api_token: string;
  room_id: number;
  body: string;
  self_unread: boolean;
  post_condition: string;
}
