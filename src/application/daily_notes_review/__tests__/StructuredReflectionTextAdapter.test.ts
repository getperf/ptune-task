import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";
import { StructuredReflectionTextAdapter } from "../services/StructuredReflectionTextAdapter";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";

describe("StructuredReflectionTextAdapter", () => {
  test("builds folder note and sentence structured text", () => {
    const adapter = new StructuredReflectionTextAdapter(buildDocument());

    expect(adapter.buildInput()).toBe([
      "[folder] push時の差分ロジック見直し",
      "[note] 新規作成で親見出し追加",
      "- 移行方針を確認した。",
      "- xmind 連携案を整理した。",
    ].join("\n"));
  });

  test("parses summarized structured text", () => {
    const adapter = new StructuredReflectionTextAdapter(buildDocument());

    const structured = adapter.parseLoose([
      "[folder] push時の差分ロジック見直し",
      "[note] 新規作成で親見出し追加",
      "- 親見出し追加方針を確認",
      "- XMind連携案を整理",
    ].join("\n"));

    expect(structured).toEqual({
      folders: [
        {
          folderTitle: "push時の差分ロジック見直し",
          notes: [
            {
              noteTitle: "新規作成で親見出し追加",
              sentences: [
                "親見出し追加方針を確認",
                "XMind連携案を整理",
              ],
            },
          ],
        },
      ],
    });
  });

  test("parses legacy uppercase markers for backward compatibility", () => {
    const adapter = new StructuredReflectionTextAdapter(buildDocument());

    const structured = adapter.parseLoose([
      "[FOLDER] push時の差分ロジック見直し",
      "[NOTE] 新規作成で親見出し追加",
      "- 親見出し追加方針を確認",
      "- XMind連携案を整理",
    ].join("\n"));

    expect(structured).toEqual({
      folders: [
        {
          folderTitle: "push時の差分ロジック見直し",
          notes: [
            {
              noteTitle: "新規作成で親見出し追加",
              sentences: [
                "親見出し追加方針を確認",
                "XMind連携案を整理",
              ],
            },
          ],
        },
      ],
    });
  });
});

function buildDocument() {
  const summaries = new NoteSummaries();
  summaries.add({
    noteFolder: "_project/331_push時の差分ロジック見直し",
    notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
    noteTitle: "新規作成で親見出し追加",
    summarySentences: [
      "移行方針を確認した。",
      "xmind 連携案を整理した。",
    ],
  });

  return new DailyNotesReflectionDocumentBuilder().build(summaries);
}
