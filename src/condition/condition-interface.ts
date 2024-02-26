export interface Condition {
  // 継承先の識別名。ダウンキャストなどで用いる
  name: string;
  // 条件を満たしたらtrueを返すよう実装する関数
  check(): boolean;
  // 内部情報を更新したらtrueを返すよう実装する関数
  update(): boolean;
  // setDataに渡すことでこのクラスのデータを復元できる文字列を返すよう実装する関数
  getData(): string;
  // getDataで得た文字列を渡すことでこのクラスのデータを復元するよう実装する関数
  setData(data: string): void;
}
