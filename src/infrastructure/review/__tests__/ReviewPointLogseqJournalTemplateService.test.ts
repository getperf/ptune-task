import { App } from "obsidian";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../../../application/daily_notes_review/models/DailyNotesReflectionDocument";
import { ReviewPointLogseqJournalTemplateService } from "../ReviewPointLogseqJournalTemplateService";

describe("ReviewPointLogseqJournalTemplateService", () => {
  test("creates the default template file and writes a Logseq journal when the template is missing", async () => {
    const adapter = {
      exists: jest.fn().mockResolvedValue(false),
      readText: jest.fn(),
      write: jest.fn().mockResolvedValue(undefined),
    };

    const app = {
      vault: {
        adapter,
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

    expect(adapter.exists).toHaveBeenCalledWith("_templates/review-logseq-journal-template.md");
    expect(adapter.write).toHaveBeenCalledWith(
      "_templates/review-logseq-journal-template.md",
      expect.stringContaining("- Fact\n    {{NoteSummaryList}}\n- KPT"),
    );
    expect(adapter.write).toHaveBeenCalledWith(
      "_review_logseq/journals/2026_04_26.md",
      expect.stringContaining("- project_title\n    - note_title\n        - sentenct_summary"),
    );
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/journals");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/pages");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_review_logseq/logseq");
    expect(app.vault.createFolder).toHaveBeenCalledWith("_templates");
  });
});
