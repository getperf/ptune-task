import { config } from "../../../config/config";
import { NoteSetupHelper } from "../NoteSetupHelper";
import { TEMPLATE_ANALYSIS_XMIND_BASE64 } from "../../../generated/templateAnalysisXmind";

type BinaryWrite = {
  path: string;
  data: ArrayBuffer;
};

describe("NoteSetupHelper", () => {
  const originalTemplatePath = config.settings.review.xmindTemplatePath;

  afterEach(() => {
    config.settings.review.xmindTemplatePath = originalTemplatePath;
  });

  test("uses bundled template when packaged asset is unavailable", async () => {
    config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";

    const folders = new Set<string>();
    const files = new Set<string>();
    const writes: BinaryWrite[] = [];

    const app = {
      vault: {
        configDir: ".obsidian",
        adapter: {
          exists: jest.fn(async (path: string) => folders.has(path) || files.has(path)),
          readBinary: jest.fn(async () => {
            throw new Error("readBinary should not be called for bundled fallback");
          }),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn(async (path: string) => {
          folders.add(path);
        }),
      },
    };

    const helper = new NoteSetupHelper(app as never);
    const result = await helper.ensureResources();

    expect(result.updatedTemplates).toEqual(["_template/xmind/template_analysis.xmind"]);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.path).toBe("_template/xmind/template_analysis.xmind");
    expect(Buffer.from(writes[0]?.data ?? new ArrayBuffer(0)).toString("base64")).toBe(
      TEMPLATE_ANALYSIS_XMIND_BASE64,
    );
    expect(app.vault.adapter.readBinary).not.toHaveBeenCalled();
  });

  test("prefers packaged asset when available", async () => {
    config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";

    const folders = new Set<string>([
      "_template",
      "_template/xmind",
      ".obsidian",
      ".obsidian/plugins",
      ".obsidian/plugins/ptune-task",
      ".obsidian/plugins/ptune-task/assets",
    ]);
    const files = new Set<string>([
      ".obsidian/plugins/ptune-task/assets/template_analysis.xmind",
    ]);
    const writes: BinaryWrite[] = [];
    const packagedData = Uint8Array.from([1, 2, 3, 4]).buffer;

    const app = {
      vault: {
        configDir: ".obsidian",
        adapter: {
          exists: jest.fn(async (path: string) => folders.has(path) || files.has(path)),
          readBinary: jest.fn(async () => packagedData),
          writeBinary: jest.fn(async (path: string, data: ArrayBuffer) => {
            files.add(path);
            writes.push({ path, data });
          }),
        },
        createFolder: jest.fn(async (path: string) => {
          folders.add(path);
        }),
      },
    };

    const helper = new NoteSetupHelper(app as never);
    await helper.ensureResources();

    expect(app.vault.adapter.readBinary).toHaveBeenCalledWith(
      ".obsidian/plugins/ptune-task/assets/template_analysis.xmind",
    );
    expect(writes).toHaveLength(1);
    expect(writes[0]?.data).toBe(packagedData);
  });
});
