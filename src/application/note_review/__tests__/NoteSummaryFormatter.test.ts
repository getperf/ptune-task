import { NoteSummaryFormatter } from "../services/NoteSummaryFormatter";

describe("NoteSummaryFormatter", () => {
  test("parses json object output into summary and summary_segments", () => {
    const formatter = new NoteSummaryFormatter();

    expect(
      formatter.formatWithSegments(
        JSON.stringify({
          summary: [
            "ptune-log の代替がなく移行方針を確認した。",
            "outliner と xmind の特徴を整理した。",
          ],
          summary_segments_markdown: "## 検討\n- ptune-log の代替がなく移行方針を確認した。\n- outliner と xmind の特徴を整理した。",
        }),
      ),
    ).toEqual({
      summarySentences: [
        "ptune-log の代替がなく移行方針を確認した。",
        "outliner と xmind の特徴を整理した。",
      ],
      summarySegmentsMarkdown: "## 検討\n- ptune-log の代替がなく移行方針を確認した。\n- outliner と xmind の特徴を整理した。",
    });
  });

  test("parses json array output into normalized sentence list", () => {
    const formatter = new NoteSummaryFormatter();

    expect(
      formatter.format(
        JSON.stringify([
          "ptune-log の代替がなく移行方針を確認した。",
          "outliner と xmind の特徴を整理した。",
          "テンプレート複製案を追加した。",
        ]),
      ),
    ).toEqual([
      "ptune-log の代替がなく移行方針を確認した。",
      "outliner と xmind の特徴を整理した。",
      "テンプレート複製案を追加した。",
    ]);
  });

  test("falls back to line-based normalization for manual edits", () => {
    const formatter = new NoteSummaryFormatter();

    expect(
      formatter.format(
        [
          "- ptune-log の代替がなく移行方針を確認した。",
          "1. outliner と xmind の特徴を整理した。",
          "",
          "* テンプレート複製案を追加した。",
        ].join("\n"),
      ),
    ).toEqual([
      "ptune-log の代替がなく移行方針を確認した。",
      "outliner と xmind の特徴を整理した。",
      "テンプレート複製案を追加した。",
    ]);
  });
});
