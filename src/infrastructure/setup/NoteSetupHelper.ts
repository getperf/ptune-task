import { App, normalizePath } from "obsidian";
import { config } from "../../config/config";
import { TEMPLATE_ANALYSIS_XMIND_BASE64 } from "../../generated/templateAnalysisXmind";

export type NoteSetupResult = {
  createdPaths: string[];
  updatedTemplates: string[];
};

export class NoteSetupHelper {
  private static readonly TARGET_DIRS = [
    "_project",
    "_journal",
  ] as const;
  private static readonly DEFAULT_XMIND_TEMPLATE_PATH = "_template/xmind/template_analysis.xmind";
  private static readonly PLUGIN_ID = "ptune-task";
  private static readonly SOURCE_TEMPLATE_PATH = "assets/template_analysis.xmind";

  constructor(private readonly app: App) {}

  async ensureResources(): Promise<NoteSetupResult> {
    const createdPaths: string[] = [];
    const updatedTemplates: string[] = [];

    for (const path of NoteSetupHelper.TARGET_DIRS) {
      if (!(await this.app.vault.adapter.exists(path))) {
        await this.app.vault.createFolder(path);
        createdPaths.push(path);
      }
    }

    const templatePath = normalizePath(
      config.settings.review.xmindTemplatePath || NoteSetupHelper.DEFAULT_XMIND_TEMPLATE_PATH,
    );
    await this.ensureParentFolders(templatePath, createdPaths);

    if (!(await this.app.vault.adapter.exists(templatePath))) {
      const data = await this.readTemplateBinary();
      await this.app.vault.adapter.writeBinary(templatePath, data);
      updatedTemplates.push(templatePath);
    }

    return { createdPaths, updatedTemplates };
  }

  private async ensureParentFolders(filePath: string, createdPaths: string[]): Promise<void> {
    const parts = filePath.split("/");
    parts.pop();

    let current = "";
    for (const part of parts) {
      current = current ? normalizePath(`${current}/${part}`) : normalizePath(part);
      if (await this.app.vault.adapter.exists(current)) {
        continue;
      }
      await this.app.vault.createFolder(current);
      createdPaths.push(current);
    }
  }

  private async readTemplateBinary(): Promise<ArrayBuffer> {
    const sourcePath = normalizePath(
      `${this.app.vault.configDir}/plugins/${NoteSetupHelper.PLUGIN_ID}/${NoteSetupHelper.SOURCE_TEMPLATE_PATH}`,
    );

    if (await this.app.vault.adapter.exists(sourcePath)) {
      return await this.app.vault.adapter.readBinary(sourcePath);
    }

    return decodeBase64ToArrayBuffer(TEMPLATE_ANALYSIS_XMIND_BASE64);
  }
}

function decodeBase64ToArrayBuffer(base64: string): ArrayBuffer {
  const buffer = Buffer.from(base64, "base64");
  return buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  );
}
