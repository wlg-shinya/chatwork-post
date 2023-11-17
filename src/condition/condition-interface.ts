export interface Condition {
  // 継承先の識別名。ダウンキャストなどで用いる
  name: string;
  // 条件を満たしたらtrueを返すよう実装する関数
  check(): boolean;
  // 条件を満たした直後に行いたい処理を実装する関数。
  // 繰り返す場合は条件の更新、もうチェックしない場合はそのようにする
  update(): void;
  // setDataに渡すことでこのクラスのデータを復元できる文字列を返すよう実装する関数
  getData(): string;
  // getDataで得た文字列を渡すことでこのクラスのデータを復元するよう実装する関数
  setData(data: string): void;
}
