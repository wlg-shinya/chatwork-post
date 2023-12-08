import { Condition } from "./condition-interface";

export class DateTimeCondition implements Condition {
  name = this.constructor.name;
  repeat = false;
  hoursMinutesString = "";
  startDateString = "";
  private _repeatIntervalDay = 1;
  set repeatIntervalDay(value: number) {
    this._repeatIntervalDay = Math.max(value, 1); // 最低1日
  }
  get repeatIntervalDay() {
    return this._repeatIntervalDay;
  }
  private _completed = false;
  get completed() {
    return this._completed;
  }

  static selectLabel = "指定の日付と時刻に投稿";
  check(): boolean {
    // 完了済みなら以後チェックは通さない
    if (this._completed) return false;
    // 登録情報が古すぎたらチェックは通さない
    if (this.tooOld()) return false;
    // これまでのチェックを通ったうえで現在時間が目標時間を少しでも越えたらチェックを通す
    return this.excessTime() > 0;
  }
  update(): void {
    if (this.repeat) {
      // 繰り返す場合、指定した繰り返し日数だけ開始日をずらして更新する
      const newStartDate = new Date(this.startTime() + this.repeatIntervalTime());
      this.startDateString = newStartDate.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    } else {
      // 繰り返さない場合、条件達成済みとする
      this._completed = true;
    }
  }
  getData(): string {
    return JSON.stringify({
      name: this.name,
      repeat: this.repeat,
      hoursMinutesString: this.hoursMinutesString,
      startDateString: this.startDateString,
      repeatIntervalDay: this.repeatIntervalDay,
      completed: this._completed,
    });
  }
  setData(data: string) {
    const d = JSON.parse(data);
    this.repeat = d.repeat;
    this.hoursMinutesString = d.hoursMinutesString;
    this.startDateString = d.startDateString;
    this.repeatIntervalDay = d.repeatIntervalDay;
    this._completed = d.completed;
  }

  constructor() {
    const today = new Date();
    // 年月日のスウェーデン基準(sv-SE)はyyyy-MM-dd。これは<input type="date">で扱う形式と同一
    this.startDateString = today.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    this.hoursMinutesString = today.toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" });
  }
  goalDateString(): string {
    const goal = new Date(this.goalTime());
    return goal.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }
  tooOld(): boolean {
    // 1時間(3600000ミリ秒)を越えていたら登録情報が古すぎるものとする
    return this.excessTime() > 3600000;
  }
  private goalTime(): number {
    return this.startTime() + this.hoursMinutesTime();
  }
  private startTime(): number {
    const match = this.startDateString.match(/([0-9]+)-([0-9]+)-([0-9]+)/);
    if (match?.length != 4) throw new Error(`this.startDateString=${this.startDateString}`);
    const date = new Date(0);
    date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3])); // 月はデータが0始まりなので調整する
    return date.getTime();
  }
  private hoursMinutesTime(): number {
    const match = this.hoursMinutesString.match(/([0-9]+):([0-9]+)/);
    if (match?.length != 3) throw new Error(`this.hoursMinutesString=${this.hoursMinutesString}`);
    const date = new Date(0);
    date.setHours(Number(match[1]), Number(match[2]));
    return date.getTime();
  }
  private repeatIntervalTime(): number {
    return this.repeatIntervalDay * 86400000; // 86400000ミリ秒 = 1日
  }
  private excessTime(): number {
    const today = new Date();
    return today.getTime() - this.goalTime();
  }
}
