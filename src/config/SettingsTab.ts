import { App, PluginSettingTab, Setting } from "obsidian";
import type PtunePlugin from "../../main";
import { config } from "./config";
import type { LogLevel } from "./types";

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

		containerEl.empty();

		new Setting(containerEl).setName("Basic settings").setHeading();

		new Setting(containerEl)
			.setName("Log level")
			.setDesc("Logger verbosity")
			.addDropdown((dropdown) =>
				dropdown
					.addOptions({
						debug: "debug",
						info: "info",
						warn: "warn",
						error: "error",
						none: "none",
					})
					.setValue(config.settings.logLevel)
					.onChange(async (value) => {
						if (!isLogLevel(value)) return;

						config.settings.logLevel = value;

						await config.save();
					}),
			);

		new Setting(containerEl)
			.setName("Enable log file")
			.setDesc("Write log file to plugin directory")
			.addToggle((toggle) =>
				toggle
					.setValue(config.settings.enableLogFile)
					.onChange(async (value) => {
						config.settings.enableLogFile = value;

						await config.save();
					}),
			);
	}
}
