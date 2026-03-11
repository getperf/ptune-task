import { App, PluginSettingTab, Setting } from "obsidian";
import { config } from "./config";
import type { LogLevel, Lang } from "./types";
import { logger } from "../shared/logger/loggerInstance";
import PtunePlugin from "main";
import { i18n } from "../shared/i18n/I18n";

function isLang(v: string): v is Lang {
	return ["ja", "en"].includes(v);
}

function isLogLevel(v: string): v is LogLevel {
	return ["debug", "info", "warn", "error", "none"].includes(v);
}

export class PtuneSettingTab extends PluginSettingTab {
	constructor(
		app: App,
		private readonly plugin: PtunePlugin,
	) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		const common = i18n.common;
		const settings = i18n.settings.basic;

		containerEl.empty();

		/* =========================
		 * Basic
		 * ========================= */

		new Setting(containerEl).setName(settings.heading).setHeading();

		/* =========================
		 * Language
		 * ========================= */

		new Setting(containerEl)
			.setName(common.language.name)
			.setDesc(common.language.desc)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						ja: common.language.options.ja,
						en: common.language.options.en,
					})
					.setValue(config.settings.language)
					.onChange(async (value) => {
						if (!isLang(value)) return;

						config.settings.language = value;

						await config.save();

						i18n.init(value);

						this.display();
					}),
			);

		/* =========================
		 * Log level
		 * ========================= */

		new Setting(containerEl)
			.setName(settings.logLevel.name)
			.setDesc(settings.logLevel.desc)
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						debug: settings.logLevel.options.debug,
						info: settings.logLevel.options.info,
						warn: settings.logLevel.options.warn,
						error: settings.logLevel.options.error,
						none: settings.logLevel.options.none,
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

		/* =========================
		 * Enable log file
		 * ========================= */

		new Setting(containerEl)
			.setName(settings.enableLogFile.name)
			.setDesc(settings.enableLogFile.desc)
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
}
