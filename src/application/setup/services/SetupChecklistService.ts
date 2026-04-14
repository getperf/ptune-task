import { App, Platform, normalizePath } from "obsidian";
import { PtuneSyncUriAuthService } from "../../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";
import { SetupChecklist, SetupItem } from "../types/SetupChecklist";
import { i18n } from "../../../shared/i18n/I18n";

type RecommendedPlugin = {
  id: string;
  isCore: boolean;
  setupId: SetupItem["id"];
  title: string;
  actionUrl: string;
};

function createObsidianUrl(path: string): string {
  return new URL(path, `https://help.${"obsidian.md"}`).toString();
}

function createCommunityPluginUrl(pluginId: string): string {
  return new URL(`/plugins?id=${pluginId}`, `https://${"obsidian.md"}`).toString();
}

export class SetupChecklistService {
  private static readonly DAILY_NOTES_GUIDE_URL =
    "https://ptune.getperf.net/ptune-task/setup/notes-setup/";

  private static readonly PTUNESYNC_GUIDE_URL =
    "https://ptune.getperf.net/ptune-task/setup/install-ptunesync/";

  private static readonly NOTE_RESOURCE_PATHS = [
    "_project",
    "_journal",
  ] as const;

  private static readonly RECOMMENDED_PLUGINS: readonly RecommendedPlugin[] = [
    {
      id: "calendar",
      isCore: false,
      setupId: "calendar",
      title: "Calendar",
      actionUrl: createCommunityPluginUrl("calendar"),
    },
    {
      id: "obsidian-outliner",
      isCore: false,
      setupId: "outliner",
      title: "Outliner",
      actionUrl: createCommunityPluginUrl("obsidian-outliner"),
    },
    {
      id: "bases",
      isCore: true,
      setupId: "bases",
      title: "Bases",
      actionUrl: createObsidianUrl("/plugins/bases"),
    },
  ];

  constructor(
    private readonly app: App,
    private readonly authService: PtuneSyncUriAuthService,
  ) {}

  async getChecklist(): Promise<SetupChecklist> {
    const required = await Promise.all([
      this.checkNoteResources(),
      this.checkDailyNotes(),
      this.checkPtuneSync(),
    ]);
    const recommended = SetupChecklistService.RECOMMENDED_PLUGINS.map((plugin) =>
      this.checkRecommendedPlugin(plugin),
    );

    return { required, recommended };
  }

  private async checkNoteResources(): Promise<SetupItem> {
    const missing: string[] = [];

    for (const path of SetupChecklistService.NOTE_RESOURCE_PATHS) {
      if (!(await this.app.vault.adapter.exists(path))) {
        missing.push(path);
      }
    }

    return missing.length === 0
      ? {
          id: "note_resources",
          title: i18n.common.setup.items.noteResources,
          level: "required",
          status: "ok",
          message: i18n.common.setup.messages.noteResourcesReady,
        }
      : {
          id: "note_resources",
          title: i18n.common.setup.items.noteResources,
          level: "required",
          status: "missing",
          message: `${i18n.common.setup.messages.missingPrefix}: ${missing.join(", ")}`,
        };
  }

  private async checkDailyNotes(): Promise<SetupItem> {
    if (!this.isPluginEnabled("daily-notes", true)) {
      return {
        id: "daily_notes",
        title: i18n.common.setup.items.dailyNotes,
        level: "required",
        status: "missing",
        message: i18n.common.setup.messages.dailyNotesPluginMissing,
        actionUrl: SetupChecklistService.DAILY_NOTES_GUIDE_URL,
      };
    }

    const config = await this.readDailyNotesConfig();
    if (!config) {
      return {
        id: "daily_notes",
        title: i18n.common.setup.items.dailyNotes,
        level: "required",
        status: "missing",
        message: i18n.common.setup.messages.dailyNotesConfigMissing,
        actionUrl: SetupChecklistService.DAILY_NOTES_GUIDE_URL,
      };
    }

    const normalizedFolder = normalizePath(config.folder || "");
    const warnings: string[] = [];

    if (!normalizedFolder) {
      warnings.push(i18n.common.setup.messages.dailyNotesFolderMissing);
    }

    return warnings.length === 0
      ? {
          id: "daily_notes",
          title: i18n.common.setup.items.dailyNotes,
          level: "required",
          status: "ok",
          message: i18n.common.setup.messages.dailyNotesReady
            .replace("{folder}", normalizedFolder)
            .replace("{template}", ""),
          actionUrl: SetupChecklistService.DAILY_NOTES_GUIDE_URL,
        }
      : {
          id: "daily_notes",
          title: i18n.common.setup.items.dailyNotes,
          level: "required",
          status: "warning",
          message: warnings.join("; "),
          actionUrl: SetupChecklistService.DAILY_NOTES_GUIDE_URL,
        };
  }

  private async checkPtuneSync(): Promise<SetupItem> {
    if (!Platform.isWin) {
      return {
        id: "ptunesync",
        title: i18n.common.setup.items.ptunesync,
        level: "required",
        status: "skipped",
        message: i18n.common.setup.messages.ptunesyncSkipped,
        actionUrl: SetupChecklistService.PTUNESYNC_GUIDE_URL,
      };
    }

    try {
      await this.authService.status();
      return {
        id: "ptunesync",
        title: i18n.common.setup.items.ptunesync,
        level: "required",
        status: "ok",
        message: i18n.common.setup.messages.ptunesyncReady,
        actionUrl: SetupChecklistService.PTUNESYNC_GUIDE_URL,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        id: "ptunesync",
        title: i18n.common.setup.items.ptunesync,
        level: "required",
        status: "missing",
        message: `${i18n.common.setup.messages.ptunesyncMissing}: ${message}`,
        actionUrl: SetupChecklistService.PTUNESYNC_GUIDE_URL,
      };
    }
  }

  private checkRecommendedPlugin(plugin: RecommendedPlugin): SetupItem {
    const enabled = this.isPluginEnabled(plugin.id, plugin.isCore);
    return {
      id: plugin.setupId,
      title: this.resolvePluginTitle(plugin.setupId),
      level: "recommended",
      status: enabled ? "ok" : "warning",
      message: enabled
        ? i18n.common.setup.messages.recommendedEnabled
        : i18n.common.setup.messages.recommendedMissing,
      actionUrl: plugin.actionUrl,
    };
  }

  private resolvePluginTitle(id: SetupItem["id"]): string {
    switch (id) {
      case "calendar":
        return i18n.common.setup.items.calendar;
      case "outliner":
        return i18n.common.setup.items.outliner;
      case "bases":
        return i18n.common.setup.items.bases;
      default:
        return id;
    }
  }

  private isPluginEnabled(pluginId: string, isCore: boolean): boolean {
    return isCore
      ? this.app.internalPlugins?.plugins?.[pluginId]?.enabled ?? false
      : this.app.plugins?.enabledPlugins?.has(pluginId) ?? false;
  }

  private async readDailyNotesConfig(): Promise<{ folder: string; template: string } | null> {
    const path = normalizePath(`${this.app.vault.configDir}/daily-notes.json`);
    if (!(await this.app.vault.adapter.exists(path))) {
      return null;
    }

    try {
      const content = await this.app.vault.adapter.read(path);
      const json = JSON.parse(content) as { folder?: string; template?: string };
      return {
        folder: json.folder ?? "",
        template: json.template ?? "",
      };
    } catch {
      return {
        folder: "",
        template: "",
      };
    }
  }
}
