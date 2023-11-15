interface Condition {
  // 継承先の型名。ダウンキャストのための情報として用いる
  typename: string;
  // 条件を満たしたらtrueを返すよう実装する関数
  check(): boolean;
}

export default Condition;
