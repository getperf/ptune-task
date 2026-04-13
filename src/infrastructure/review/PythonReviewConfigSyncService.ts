import { homedir } from "os";
import { join } from "path";
import { mkdir, rename, writeFile } from "fs/promises";
import { buildNoteSummarySystemPrompt } from "../../application/note_review/prompts/buildNoteSummaryPrompt";
import { config } from "../../config/config";

export interface SyncedPythonReviewConfig {
  profileId: string;
  profilesFile: string;
  credentialsFile: string;
}

const DEFAULT_PROFILE_ID = "default-note-review";
const DEFAULT_CREDENTIAL_ID = "ptune-task-default";

export class PythonReviewConfigSyncService {
  async syncIfEnabled(): Promise<SyncedPythonReviewConfig | null> {
    if (!config.settings.eventHook.enabled) {
      return null;
    }
    return this.sync();
  }

  async sync(): Promise<SyncedPythonReviewConfig> {
    const provider = config.settings.llm.provider;
    if (provider !== "openai" && provider !== "custom") {
      throw new Error(`Python review event hook supports only openai/custom providers: ${provider}`);
    }

    const root = join(homedir(), ".ptune", "llm");
    const profilesFile = join(root, "profiles.json");
    const credentialsFile = join(root, "credentials.json");
    await mkdir(root, { recursive: true });

    const profilesPayload = {
      schema_version: 1,
      profiles: [
        {
          profile_id: DEFAULT_PROFILE_ID,
          provider,
          model: config.settings.llm.model,
          base_url: config.settings.llm.baseUrl,
          api_key_credential_id: DEFAULT_CREDENTIAL_ID,
          temperature: config.settings.llm.temperature,
          max_input_chars: 16000,
          max_output_tokens: config.settings.llm.maxTokens,
          summary_prompt: {
            strategy: "inline",
            language: "ja",
            max_sentences: 5,
            system: buildNoteSummarySystemPrompt(),
          },
          tagging_prompt: {
            strategy: "inline",
            language: "ja",
            system: "You propose topic and state tags for Obsidian notes.",
            max_tags: 6,
          },
        },
      ],
    };

    const credentialsPayload = {
      schema_version: 1,
      credentials: [
        {
          credential_id: DEFAULT_CREDENTIAL_ID,
          kind: "plaintext",
          api_key_plaintext: config.settings.llm.apiKey,
          headers: {},
        },
      ],
    };

    await this.writeJsonAtomic(profilesFile, profilesPayload);
    await this.writeJsonAtomic(credentialsFile, credentialsPayload);

    return {
      profileId: DEFAULT_PROFILE_ID,
      profilesFile,
      credentialsFile,
    };
  }

  private async writeJsonAtomic(path: string, payload: unknown): Promise<void> {
    const tmpPath = `${path}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
    await rename(tmpPath, path);
  }
}
