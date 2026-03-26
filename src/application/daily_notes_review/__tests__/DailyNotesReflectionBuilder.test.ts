import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { DailyNotesReflectionBuilder } from "../builders/DailyNotesReflectionBuilder";
import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";

describe("DailyNotesReflectionBuilder", () => {
  test("builds outline reflection with guidance comment", () => {
    const doc = buildDocument();
    const builder = new DailyNotesReflectionBuilder();

    expect(builder.build(doc, "outline")).toContain(
      "下記は当日のノート要約から抽出した振り返り素材です。",
    );
    expect(builder.build(doc, "outline")).toContain("- push時の差分ロジック見直し");
    expect(builder.build(doc, "outline")).toContain("  - 新規作成で親見出し追加");
    expect(builder.build(doc, "outline")).toContain("    - 親見出しの追加手順を確認した");
  });

  test("builds xmind reflection with links and output block", () => {
    const doc = buildDocument();
    const builder = new DailyNotesReflectionBuilder();
    const markdown = builder.build(doc, "xmind", {
      xmindFileLink: "_journal/2026/03/2026-03-16_reviewpoint.xmind",
      xmindInputFileLink: "_journal/2026/03/2026-03-16_reviewpoint_input.txt",
    });

    expect(markdown).toContain("[XMind による振り返り手順]");
    expect(markdown).toContain("[編集用 XMind ファイルを開く](_journal/2026/03/2026-03-16_reviewpoint.xmind)");
    expect(markdown).toContain("[XMind インプットテキストを開く](_journal/2026/03/2026-03-16_reviewpoint_input.txt)");
    expect(markdown).toContain("**アウトプット（XMind 編集結果）**");
  });

  test("escapes angle brackets in outline reflection text", () => {
    const builder = new DailyNotesReflectionBuilder();
    const markdown = builder.build(
      new DailyNotesReflectionDocumentBuilder().build(
        buildSummaries({
          noteFolder: "_project/337_PtuneSync移行準備",
          notePath: "_project/337_PtuneSync移行準備/01_リトライ調査.md",
          noteTitle: "ProtocolDispatcher の <XXX> 対応",
          summary: "ProtocolDispatcher の <XXX> は補助にとどめる",
        }),
      ),
      "outline",
    );

    expect(markdown).toContain("- PtuneSync移行準備");
    expect(markdown).toContain("  - ProtocolDispatcher の &lt;XXX&gt; 対応");
    expect(markdown).toContain("    - ProtocolDispatcher の &lt;XXX&gt; は補助にとどめる");
  });

  test("builds structured outline reflection", () => {
    const builder = new DailyNotesReflectionBuilder();
    const markdown = builder.buildStructured(buildStructured(), "outline");

    expect(markdown).toContain("- push時の差分ロジック見直し");
    expect(markdown).toContain("  - 新規作成で親見出し追加");
    expect(markdown).toContain("    - 親見出し追加方針を確認");
  });

  test("builds structured xmind input", () => {
    const builder = new DailyNotesReflectionBuilder();

    expect(builder.buildStructuredXmindInput(buildStructured())).toBe([
      "push時の差分ロジック見直し",
      "\t新規作成で親見出し追加",
      "\t\t親見出し追加方針を確認",
      "\t\tXMind連携案を整理",
    ].join("\n"));
  });
});

function buildDocument() {
  return new DailyNotesReflectionDocumentBuilder().build(buildSummaries());
}

function buildStructured(): StructuredReflectionText {
  return {
    folders: [
      {
        folderTitle: "push時の差分ロジック見直し",
        notes: [
          {
            noteTitle: "新規作成で親見出し追加",
            sentences: ["親見出し追加方針を確認", "XMind連携案を整理"],
          },
        ],
      },
    ],
  };
}

function buildSummaries(
  note: {
    noteFolder: string;
    notePath: string;
    noteTitle: string;
    summary: string;
  } = {
    noteFolder: "_project/331_push時の差分ロジック見直し",
    notePath: "_project/331_push時の差分ロジック見直し/01_新規作成で親見出し追加.md",
    noteTitle: "新規作成で親見出し追加",
    summary: "親見出しの追加手順を確認した",
  },
): NoteSummaries {
  const summaries = new NoteSummaries();
  summaries.add(note);
  return summaries;
}
