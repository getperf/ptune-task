import { Setting } from "obsidian";
import { config } from "./config";
import type { LogLevel, SyncBackend } from "./types";
import { logger } from "../shared/logger/loggerInstance";
import { i18n } from "../shared/i18n/I18n";

function isLogLevel(v: string): v is LogLevel {
	return ["debug", "info", "warn", "error", "none"].includes(v);
}

function isSyncBackend(v: string): v is SyncBackend {
	return ["ptune-task", "ptune-sync-skel"].includes(v);
}

export function renderBasicSettings(containerEl: HTMLElement) {
	const t = i18n.settings.basic;

	new Setting(containerEl).setName(t.heading).setHeading();

	new Setting(containerEl)
		.setName(t.syncBackend.name)
		.setDesc(t.syncBackend.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					"ptune-task": t.syncBackend.options["ptune-task"],
					"ptune-sync-skel": t.syncBackend.options["ptune-sync-skel"],
				})
				.setValue(config.settings.syncBackend)
				.onChange(async (value) => {
					if (!isSyncBackend(value)) return;

					config.settings.syncBackend = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.logLevel.name)
		.setDesc(t.logLevel.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					debug: t.logLevel.options.debug,
					info: t.logLevel.options.info,
					warn: t.logLevel.options.warn,
					error: t.logLevel.options.error,
					none: t.logLevel.options.none,
				})
				.setValue(config.settings.logLevel)
				.onChange(async (value) => {
					if (!isLogLevel(value)) return;

					config.settings.logLevel = value;
					await config.save();

					logger.configure(
						config.settings.logLevel,
						config.settings.enableLogFile,
					);
				}),
		);

	new Setting(containerEl)
		.setName(t.enableLogFile.name)
		.setDesc(t.enableLogFile.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.enableLogFile)
				.onChange(async (value) => {
					config.settings.enableLogFile = value;
					await config.save();

					logger.configure(
						config.settings.logLevel,
						config.settings.enableLogFile,
					);
				}),
		);
}
