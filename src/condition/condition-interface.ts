export interface Condition {
  // 継承先の型名。ダウンキャストのための情報として用いる
  type: string;
  // 条件を満たしたらtrueを返すよう実装する関数
  check(): boolean;
  // setDataに渡すことでこのクラスのデータを復元できる文字列を返すよう実装する関数
  getData(): string;
  // getDataで得た文字列を渡すことでこのクラスのデータを復元するよう実装する関数
  setData(data: string): void;
}
