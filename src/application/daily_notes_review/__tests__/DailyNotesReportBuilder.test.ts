import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { DailyNotesReportBuilder } from "../builders/DailyNotesReportBuilder";

describe("DailyNotesReportBuilder", () => {
  test("merges sentence lists into a single report line", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/331_push時の差分ロジック見直し",
      notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
      noteTitle: "新規作成で親見出し追加",
      summarySentences: [
        "親見出しの追加手順を確認した。",
        "テンプレート構成を整理した。",
      ],
    });

    const builder = new DailyNotesReportBuilder();

    expect(builder.build(summaries)).toBe(
      [
        "- push時の差分ロジック見直し",
        "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
        "    - 親見出しの追加手順を確認した。 テンプレート構成を整理した。",
      ].join("\n"),
    );
  });

  test("omits summary lines when summaries are disabled", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/331_push時の差分ロジック見直し",
      notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
      noteTitle: "新規作成で親見出し追加",
      summary: "これは表示しない",
    });

    const builder = new DailyNotesReportBuilder();

    expect(
      builder.build(summaries, { includeSummaries: false }),
    ).toBe(
      [
        "- push時の差分ロジック見直し",
        "  - [新規作成で親見出し追加](_project/331_push%E6%99%82%E3%81%AE%E5%B7%AE%E5%88%86%E3%83%AD%E3%82%B8%E3%83%83%E3%82%AF%E8%A6%8B%E7%9B%B4%E3%81%97/01_%E6%96%B0%E8%A6%8F%E4%BD%9C%E6%88%90%E3%81%A7%E8%A6%AA%E8%A6%8B%E5%87%BA%E3%81%97%E8%BF%BD%E5%8A%A0.md)",
      ].join("\n"),
    );
  });

  test("escapes angle brackets in rendered report text", () => {
    const summaries = new NoteSummaries();
    summaries.add({
      noteFolder: "_project/337_PtuneSync移行準備",
      notePath: "_project/337_PtuneSync移行準備/01_リトライ調査.md",
      noteTitle: "ProtocolDispatcher の <XXX> 対応",
      summary: "ProtocolDispatcher の <XXX> は補助にとどめる。",
    });

    const builder = new DailyNotesReportBuilder();

    expect(builder.build(summaries)).toBe(
      [
        "- PtuneSync移行準備",
        "  - [ProtocolDispatcher の &lt;XXX&gt; 対応](_project/337_PtuneSync%E7%A7%BB%E8%A1%8C%E6%BA%96%E5%82%99/01_%E3%83%AA%E3%83%88%E3%83%A9%E3%82%A4%E8%AA%BF%E6%9F%BB.md)",
        "    - ProtocolDispatcher の &lt;XXX&gt; は補助にとどめる。",
      ].join("\n"),
    );
  });
});
