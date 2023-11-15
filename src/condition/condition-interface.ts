interface Condition {
  // 継承先の型名。ダウンキャストのための情報として用いる
  typename: string;
  // 条件を満たしたらtrueを返すよう実装する関数
  check(): boolean;
  // 情報が登録される直前に行う各種設定の最終調整を実装する関数
  setup(): void;
}

export default Condition;
