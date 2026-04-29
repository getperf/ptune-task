import { App } from "obsidian";
import { config } from "../../../../config/config";
import { SetupChecklistService } from "../SetupChecklistService";

describe("SetupChecklistService", () => {
  const originalXmindPath = config.settings.review.xmindTemplatePath;
  const originalLogseqPath = config.settings.review.logseqJournalTemplatePath;

  afterEach(() => {
    config.settings.review.xmindTemplatePath = originalXmindPath;
    config.settings.review.logseqJournalTemplatePath = originalLogseqPath;
  });

  test("note_resources is missing when required folders or review template paths are absent", async () => {
    config.settings.review.xmindTemplatePath = "";
    config.settings.review.logseqJournalTemplatePath = "";

    const existsMock = jest.fn(async (path: string) =>
      path === "_project" || path === "_journal",
    );

    const app = {
      vault: {
        adapter: {
          exists: existsMock,
          read: jest.fn(),
        },
      },
      plugins: { enabledPlugins: new Set<string>() },
      internalPlugins: { plugins: {} },
    } as unknown as App;

    const authService = { status: jest.fn().mockResolvedValue(undefined) };
    const service = new SetupChecklistService(app, authService as any);

    const checklist = await service.getChecklist();
    const noteResources = checklist.required.find((item) => item.id === "note_resources");

    expect(noteResources).toBeDefined();
    expect(noteResources?.status).toBe("missing");
    expect(noteResources?.message).toContain("review.xmindTemplatePath");
    expect(noteResources?.message).toContain("review.logseqJournalTemplatePath");
    expect(noteResources?.message).toContain("_template");
    expect(noteResources?.message).toContain("_template/note");
  });

  test("note_resources is ok when required folders exist and review template paths are configured", async () => {
    const existsMock = jest.fn(async (path: string) =>
      ["_project", "_journal", "_template", "_template/note"].includes(path),
    );

    const app = {
      vault: {
        adapter: {
          exists: existsMock,
          read: jest.fn().mockResolvedValue("{}"),
        },
      },
      plugins: { enabledPlugins: new Set<string>() },
      internalPlugins: { plugins: {} },
    } as unknown as App;

    const authService = { status: jest.fn().mockResolvedValue(undefined) };
    const service = new SetupChecklistService(app, authService as any);

    const checklist = await service.getChecklist();
    const noteResources = checklist.required.find((item) => item.id === "note_resources");

    expect(noteResources).toBeDefined();
    expect(noteResources?.status).toBe("ok");
  });
});
