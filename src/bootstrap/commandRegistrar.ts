import { Notice, Plugin } from "obsidian";
import { Container } from "./container";
import { i18n } from "../shared/i18n/I18n";

export function registerAllCommands(plugin: Plugin, container: Container): void {
  plugin.addCommand({
    id: "pull-today",
    name: i18n.common.commands.pullToday,
    callback: () => { container.createPullTodayCommand().execute(); },
  });

  plugin.addCommand({
    id: "sync",
    name: i18n.common.commands.pushToday,
    callback: () => { container.createSyncAndRebuildCommand().execute(); },
  });

  plugin.addCommand({
    id: "review",
    name: i18n.common.commands.dailyReview,
    callback: () => { container.createReviewCommand().execute(); },
  });

  plugin.addCommand({
    id: "login",
    name: i18n.common.commands.login,
    callback: async () => {
      try {
        await container.createAuthLoginProgressService().run(() =>
          container.createAuthService().login());
        new Notice(i18n.common.auth.notice.loginSucceeded);
      } catch (e: unknown) {
        new Notice(`${i18n.common.auth.notice.loginFailed}: ${e instanceof Error ? e.message : String(e)}`);
      }
    },
  });

  plugin.addCommand({
    id: "auth-status",
    name: i18n.common.commands.authStatus,
    callback: async () => {
      try {
        const result = await container.createAuthService().status();
        if (result.authenticated) {
          new Notice(result.email
            ? `${i18n.common.auth.notice.authenticatedWithEmail}: ${result.email}`
            : i18n.common.auth.notice.authenticated);
          return;
        }

        new Notice(i18n.common.auth.notice.notAuthenticated);
      } catch {
        new Notice(i18n.common.auth.notice.notAuthenticated);
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
