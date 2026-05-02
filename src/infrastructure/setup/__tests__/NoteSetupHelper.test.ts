import { App } from "obsidian";
import { config } from "../../../config/config";
import { NoteSetupHelper } from "../NoteSetupHelper";
import { TEMPLATE_ANALYSIS_XMIND_BASE64 } from "../../../generated/templateAnalysisXmind";

type BinaryWrite = {
  path: string;
  data: ArrayBuffer;
};

describe("NoteSetupHelper", () => {
  const originalTemplatePath = config.settings.review.xmindTemplatePath;
  const originalXmindOutlineTemplatePath = config.settings.review.xmindReviewOutlineTemplatePath;
  const originalLogseqTemplatePath = config.settings.review.logseqJournalTemplatePath;
  const configDir = "vault-config";

  afterEach(() => {
    config.settings.review.xmindTemplatePath = originalTemplatePath;
    config.settings.review.xmindReviewOutlineTemplatePath = originalXmindOutlineTemplatePath;
    config.settings.review.logseqJournalTemplatePath = originalLogseqTemplatePath;
  });

  test("uses bundled template when packaged asset is unavailable", async () => {
    config.settings.review.xmindTemplatePath =
      "_template/xmind/template_analysis.xmind";
    config.settings.review.xmindReviewOutlineTemplatePath =
      "_template/xmind/review-outline-template.md";
    config.settings.review.logseqJournalTemplatePath =
      "_template/review-logseq-journal-template.md";

    const folders = new Set<string>(["_template"]);
    const files = new Set<string>([
      "_template/xmind/review-outline-template.md",
      "_template/review-logseq-journal-template.md",
    ]);
    const writes: BinaryWrite[] = [];

    const app = {
      vault: {
        configDir,
        adapter: {
          exists: jest.fn<boolean, [string]>(
            (path: string) => folders.has(path) || files.has(path),
          ),
          readBinary: jest.fn(() => {
            throw new Error(
              "readBinary should not be called for bundled fallback",
            );
          }),
          writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>((path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
          write: jest.fn<Promise<void>, [string, string]>((path: string, data: string) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn((path: string) => {
          folders.add(path);
        }),
      },
    } as unknown as App;

    const helper = new NoteSetupHelper(app);
    const result = await helper.ensureResources();

    expect(result.updatedTemplates).toEqual([
      "_template/xmind/template_analysis.xmind",
    ]);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.path).toBe("_template/xmind/template_analysis.xmind");
    expect(
      Buffer.from(writes[0]?.data ?? new ArrayBuffer(0)).toString(
        "base64",
      ),
    ).toBe(TEMPLATE_ANALYSIS_XMIND_BASE64);
    expect(app.vault.adapter.readBinary).not.toHaveBeenCalled();
    expect(folders).toContain("_template/note");
  });

  test("prefers packaged asset when available", async () => {
    config.settings.review.xmindTemplatePath =
      "_template/xmind/template_analysis.xmind";
    config.settings.review.xmindReviewOutlineTemplatePath =
      "_template/xmind/review-outline-template.md";
    config.settings.review.logseqJournalTemplatePath =
      "_template/review-logseq-journal-template.md";

    const folders = new Set<string>([
      "_template",
      "_template/xmind",
      configDir,
      `${configDir}/plugins`,
      `${configDir}/plugins/ptune-task`,
      `${configDir}/plugins/ptune-task/assets`,
      "_template",
    ]);
    const files = new Set<string>([
      `${configDir}/plugins/ptune-task/assets/template_analysis.xmind`,
      "_template/xmind/review-outline-template.md",
      "_template/review-logseq-journal-template.md",
    ]);
    const writes: BinaryWrite[] = [];
    const packagedData = Uint8Array.from([1, 2, 3, 4]).buffer;

    const app = {
      vault: {
        configDir,
        adapter: {
          exists: jest.fn<boolean, [string]>(
            (path: string) => folders.has(path) || files.has(path),
          ),
          readBinary: jest.fn(() => packagedData),
          writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>((path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
          write: jest.fn<Promise<void>, [string, string]>((path: string, data: string) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn((path: string) => {
          folders.add(path);
        }),
      },
    } as unknown as App;

    const helper = new NoteSetupHelper(app);
    await helper.ensureResources();

    expect(app.vault.adapter.readBinary).toHaveBeenCalledWith(
      `${configDir}/plugins/ptune-task/assets/template_analysis.xmind`,
    );
    expect(writes).toHaveLength(1);
    expect(writes[0]?.data).toBe(packagedData);
  });

  test("creates Logseq journal template when missing", async () => {
    config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";
    config.settings.review.xmindReviewOutlineTemplatePath = "_template/xmind/review-outline-template.md";
    config.settings.review.logseqJournalTemplatePath = "_template/review-logseq-journal-template.md";

    const folders = new Set<string>([
      "_template",
      "_template/xmind",
    ]);
    const files = new Set<string>();
    const writes: Array<{ path: string; data: string | ArrayBuffer }> = [];

    const app = {
      vault: {
        configDir,
        adapter: {
          exists: jest.fn<boolean, [string]>(
            (path: string) => folders.has(path) || files.has(path),
          ),
          readBinary: jest.fn(() => {
            throw new Error(
              "readBinary should not be called for bundled fallback",
            );
          }),
          writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>((path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
          write: jest.fn<Promise<void>, [string, string]>((path: string, data: string) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn((path: string) => {
          folders.add(path);
        }),
      },
    } as unknown as App;

    const helper = new NoteSetupHelper(app);
    const result = await helper.ensureResources();

    expect(result.updatedTemplates).toContain(
      "_template/review-logseq-journal-template.md",
    );
    const templateWrite = writes.find(
      (write) => write.path === "_template/review-logseq-journal-template.md",
    );

    expect(templateWrite).toBeDefined();
    expect(templateWrite?.data).toContain("- Fact\n    {{NoteSummaryList}}\n- KPT");
    expect(folders).toContain("_template");
  });

  test("creates XMind review outline template when missing", async () => {
    config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";
    config.settings.review.xmindReviewOutlineTemplatePath = "_template/xmind/review-outline-template.md";
    config.settings.review.logseqJournalTemplatePath = "_template/review-logseq-journal-template.md";

    const folders = new Set<string>([
      "_template",
      "_template/xmind",
    ]);
    const files = new Set<string>([
      "_template/xmind/template_analysis.xmind",
      "_template/review-logseq-journal-template.md",
    ]);
    const writes: Array<{ path: string; data: string | ArrayBuffer }> = [];

    const app = {
      vault: {
        configDir,
        adapter: {
          exists: jest.fn<boolean, [string]>(
            (path: string) => folders.has(path) || files.has(path),
          ),
          readBinary: jest.fn(() => {
            throw new Error("readBinary should not be called");
          }),
          writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>((path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
          write: jest.fn<Promise<void>, [string, string]>((path: string, data: string) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn((path: string) => {
          folders.add(path);
        }),
      },
    } as unknown as App;

    const helper = new NoteSetupHelper(app);
    const result = await helper.ensureResources();

    expect(result.updatedTemplates).toContain(
      "_template/xmind/review-outline-template.md",
    );
    const templateWrite = writes.find(
      (write) => write.path === "_template/xmind/review-outline-template.md",
    );

    expect(templateWrite).toBeDefined();
    expect(templateWrite?.data).toContain("Fact はノートサマリセンテンス");
    expect(templateWrite?.data).toContain("KPT\n\tKeep\n\tProblem\n\tTry");
  });
});
