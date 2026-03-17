import { NoteSummaryFormatter } from "../services/NoteSummaryFormatter";

describe("NoteSummaryFormatter", () => {
  test("normalizes multi-line llm output into a single paragraph", () => {
    const formatter = new NoteSummaryFormatter();

    expect(
      formatter.format(
        [
          "- ptune-log の代替がなく移行方針を確認した。",
          "- outliner と xmind の特徴を整理した。",
          "",
          "- テンプレート複製案を追加した。",
        ].join("\n"),
      ),
    ).toBe(
      "ptune-log の代替がなく移行方針を確認した。 outliner と xmind の特徴を整理した。 テンプレート複製案を追加した。",
    );
  });
});
