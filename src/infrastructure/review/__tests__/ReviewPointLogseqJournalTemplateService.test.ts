import { App } from "obsidian";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../../../application/daily_notes_review/models/DailyNotesReflectionDocument";
import { ReviewPointLogseqJournalTemplateService } from "../ReviewPointLogseqJournalTemplateService";

type LogseqTemplateServiceTestApi = {
  fillTemplate: (
    template: string,
    note: DailyNote,
    doc: DailyNotesReflectionDocument,
  ) => string;
};

describe("ReviewPointLogseqJournalTemplateService", () => {
  test("creates the default template file and writes a Logseq journal when the template is missing", async () => {
    const adapter = {
      exists: jest.fn().mockResolvedValue(false),
      write: jest.fn().mockResolvedValue(undefined),
    };

    const templateFile = {
      path: "_template/review-logseq-journal-template.md",
    };
    const app = {
      vault: {
        adapter,
        getAbstractFileByPath: jest.fn().mockReturnValue(templateFile),
        read: jest.fn().mockResolvedValue("- Fact\n    {{NoteSummaryList}}\n- KPT\n    - Keep\n    - Problem\n    - Try"),
        createFolder: jest.fn().mockResolvedValue(undefined),
      },
    } as unknown as App;

    const service = new ReviewPointLogseqJournalTemplateService(app);
    const note = new DailyNote("2026-04-26", "_journal/2026/04/2026-04-26.md", "before");
    const doc = new DailyNotesReflectionDocument([
      {
        projectTitle: "project_title",
        notes: [
          {
            noteTitle: "note_title",
            sentences: [
              { text: "sentenct_summary" },
            ],
          },
        ],
      },
    ]);

    await service.ensureForDailyNote(note, doc);

    expect(adapter.exists).toHaveBeenCalledWith("_template/review-logseq-journal-template.md");
    expect(adapter.write).toHaveBeenCalledWith(
      "_template/review-logseq-journal-template.md",
      expect.stringContaining("- Fact\n    {{NoteSummaryList}}\n- KPT"),
    );
    expect(adapter.write).toHaveBeenCalledWith(
      "_review_logseq/journals/2026_04_26.md",
      expect.stringContaining("    - project_title\n        - note_title\n            - sentenct_summary"),
    );
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/journals");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/pages");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/logseq");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_template");
  });

  test("fillTemplate preserves indentation when the placeholder is indented by 4 spaces", () => {
    const service = new ReviewPointLogseqJournalTemplateService({} as App);
    const template = [
      "- Fact",
      "    {{NoteSummaryList}}",
      "- KPT",
      "    - Keep",
      "    - Problem",
      "    - Try",
    ].join("\n");
    const note = new DailyNote("2026-04-26", "_journal/2026/04/2026-04-26.md", "before");
    const doc = new DailyNotesReflectionDocument([
      {
        projectTitle: "project_title",
        notes: [
          {
            noteTitle: "note_title",
            sentences: [
              { text: "sentenct_summary" },
            ],
          },
        ],
      },
    ]);

    const result = (service as unknown as LogseqTemplateServiceTestApi).fillTemplate(
      template,
      note,
      doc,
    );

    expect(result).toContain(
      "    - project_title\n        - note_title\n            - sentenct_summary",
    );
  });

  test("buildDeepLink returns logseq deep link using the last segment of logseqRootPath as graph name", () => {
    const service = new ReviewPointLogseqJournalTemplateService({} as App);

    const result = service.buildDeepLink("2026-04-28");

    // デフォルトの _review_logseq がグラフ名として使われる
    expect(result).toBe("logseq://graph/_review_logseq?page=2026-04-28");
  });
});
