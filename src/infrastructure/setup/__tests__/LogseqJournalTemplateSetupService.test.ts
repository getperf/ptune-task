import { App } from "obsidian";
import { LogseqJournalTemplateSetupService } from "../LogseqJournalTemplateSetupService";

describe("LogseqJournalTemplateSetupService", () => {
  test("creates the default Logseq journal template when missing", async () => {
    const folders = new Set<string>();
    const files = new Set<string>();
    const writes: Array<{ path: string; data: string }> = [];

    const app = {
      vault: {
        adapter: {
          exists: jest.fn<Promise<boolean>, [string]>(async (path: string) => folders.has(path) || files.has(path)),
          write: jest.fn<Promise<void>, [string, string]>(async (path: string, data: string) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn(async (path: string) => {
          folders.add(path);
        }),
      },
    } as unknown as App;

    const service = new LogseqJournalTemplateSetupService(app);
    const createdPaths: string[] = [];
    const templatePath = await service.ensureTemplateExists(createdPaths);

    expect(templatePath).toBe("_template/review-logseq-journal-template.md");
    expect(createdPaths).toContain("_template");
    const templateWrite = writes.find(
      (write) => write.path === "_template/review-logseq-journal-template.md",
    );

    expect(templateWrite).toBeDefined();
    expect(templateWrite?.data).toContain("- Fact\n    {{NoteSummaryList}}\n- KPT");
  });

  test("does not overwrite existing Logseq journal template", async () => {
    const folders = new Set<string>(["_template"]);
    const files = new Set<string>(["_template/review-logseq-journal-template.md"]);
    const writes = [];

    const app = {
      vault: {
        adapter: {
          exists: jest.fn<Promise<boolean>, [string]>(async (path: string) => folders.has(path) || files.has(path)),
          write: jest.fn<Promise<void>, [string, string]>(async (path: string, data: string) => {
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn(async () => {
          throw new Error("should not create folders when template exists");
        }),
      },
    } as unknown as App;

    const service = new LogseqJournalTemplateSetupService(app);
    const createdPaths: string[] = [];
    const templatePath = await service.ensureTemplateExists(createdPaths);

    expect(templatePath).toBeNull();
    expect(createdPaths).toHaveLength(0);
    expect(writes).toHaveLength(0);
  });
});
