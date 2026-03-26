import { Notice, Plugin } from "obsidian";
import { Container } from "./container";
import { i18n } from "../shared/i18n/I18n";

export function registerAllCommands(plugin: Plugin, container: Container): void {
  plugin.addCommand({
    id: "pull-today",
    name: "Pull Today",
    callback: () => { container.createPullTodayCommand().execute(); },
  });

  plugin.addCommand({
    id: "ptunesync-diff-check",
    name: "PtuneSync Diff Check",
    callback: () => { container.createDiffCheckCommand().execute(); },
  });

  plugin.addCommand({
    id: "cleanup-sync-runs",
    name: "Cleanup Sync Runs",
    callback: () => { container.createCleanupSyncRunsCommand().execute(); },
  });

  plugin.addCommand({
    id: "sync",
    name: "Push and Rebuild",
    callback: () => { container.createSyncAndRebuildCommand().execute(); },
  });

  plugin.addCommand({
    id: "review",
    name: "Generate Daily Review",
    callback: () => { container.createReviewCommand().execute(); },
  });

  plugin.addCommand({
    id: "login",
    name: "Login",
    callback: async () => {
      try {
        await container.createAuthService().login();
        new Notice("Google login successful.");
      } catch (e: unknown) {
        new Notice(`Login failed: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  });

  plugin.addCommand({
    id: "auth-status",
    name: "Auth Status",
    callback: async () => {
      try {
        const result = await container.createAuthService().status();
        if (result.authenticated) {
          new Notice(result.email ? `Authenticated: ${result.email}` : "Authenticated");
          return;
        }

        new Notice("Not authenticated. Please login.");
      } catch {
        new Notice("Not authenticated. Please login.");
      }
    },
  });

  plugin.addCommand({
    id: "setup-wizard",
    name: i18n.common.setup.command.open,
    callback: () => {
      container.createSetupWizardDialog().open();
    },
  });
}
