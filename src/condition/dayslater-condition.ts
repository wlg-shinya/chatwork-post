import Condition from "./condition-interface";

class DaysLaterCondition implements Condition {
  typename = this.constructor.name;
  check(): boolean {
    // 今の時間が境界時間を越えていたら条件成立
    return this.today().getTime() > this.borderTime();
  }

  constructor(daysLater: number, hoursMinutesString: string, startDateString?: string) {
    this.daysLater = daysLater;
    this.hoursMinutesString = hoursMinutesString;
    if (typeof startDateString !== "undefined") {
      this.startDateString = startDateString;
    } else {
      // 起点日が設定されていないなら今日を起点日にする
      const today = this.today();
      this.startDateString = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`; // 月はデータが0始まりなので調整する
    }
  }

  daysLater;
  hoursMinutesString;
  startDateString;

  daysLaterString(): string {
    if (this.daysLater == 0) {
      return "今日";
    } else {
      return `${this.daysLater}日後`;
    }
  }

  private today(): Date {
    return new Date(Date.now());
  }
  private borderTime(): number {
    // 起点日の情報構築
    let startTime = 0;
    {
      const match = this.startDateString.match(/([0-9]+)-([0-9]+)-([0-9]+)/);
      if (match?.length != 4) throw new Error('[DaysLaterCondition] Invalid value "startDateString"');
      const date = new Date();
      date.setFullYear(Number(match[1]), Number(match[2]) - 1, Number(match[3])); // 月はデータが0始まりなので調整する
      startTime = date.getTime();
    }
    // 経過日数の情報構築
    let daysLaterTime = 0;
    {
      const daysLater = Math.max(this.daysLater, 0); // 0未満は0(当日)と扱う
      const date = new Date();
      date.setDate(daysLater);
      daysLaterTime = date.getTime();
    }
    // 指定時分の情報構築
    let hoursMinutesTime = 0;
    {
      const match = this.hoursMinutesString.match(/([0-9]+):([0-9]+)/);
      if (match?.length != 3) throw new Error('[DaysLaterCondition] Invalid value "hoursMinutesString"');
      const date = new Date();
      date.setHours(Number(match[1]), Number(match[2]), 0, 0);
      hoursMinutesTime = date.getTime();
    }
    // 起点日 + 経過日数 + 指定時分 のUNIX時間を条件成立境界時間とする
    return startTime + daysLaterTime + hoursMinutesTime;
  }
}

export default DaysLaterCondition;
