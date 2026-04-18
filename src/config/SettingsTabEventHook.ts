import { Notice, Setting } from "obsidian";
import { shell } from "electron";
import { homedir } from "os";
import { join } from "path";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

type ElectronShellLike = {
	openPath?: (targetPath: string) => Promise<string>;
};

export function renderEventHookSettings(containerEl: HTMLElement) {
	const t = i18n.settings.eventHook;

	new Setting(containerEl).setName(t.heading).setHeading();

	new Setting(containerEl)
		.setName(t.enabled.name)
		.setDesc(t.enabled.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.eventHook.enabled)
				.onChange(async (value) => {
					config.settings.eventHook.enabled = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.interopRoot.name)
		.setDesc(t.interopRoot.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.interopRoot.placeholder)
				.setValue(config.settings.eventHook.interopRoot)
				.onChange(async (value) => {
					config.settings.eventHook.interopRoot = value.trim();
					await config.save();
				}),
		)
		.addButton((button) =>
			button
				.setIcon("folder-open")
				.setTooltip(t.interopRoot.openButton)
				.onClick(async () => {
					const interopRoot =
						config.settings.eventHook.interopRoot.trim() ||
						join(homedir(), ".codex-md-export");
					const opened = await openFolderInExplorer(interopRoot);
					if (!opened) {
						new Notice(t.interopRoot.openFailed);
					}
				}),
		);

	new Setting(containerEl)
		.setName(t.pythonExePath.name)
		.setDesc(t.pythonExePath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.pythonExePath.placeholder)
				.setValue(config.settings.eventHook.pythonExePath)
				.onChange(async (value) => {
					config.settings.eventHook.pythonExePath = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.daemonArgs.name)
		.setDesc(t.daemonArgs.desc)
		.addTextArea((text) => {
			text
				.setPlaceholder(t.daemonArgs.placeholder)
				.setValue(config.settings.eventHook.daemonArgs)
				.onChange(async (value) => {
					config.settings.eventHook.daemonArgs = value.trim();
					await config.save();
				});
			text.inputEl.rows = 3;
			return text;
		});

	new Setting(containerEl)
		.setName(t.ensureOnEvent.name)
		.setDesc(t.ensureOnEvent.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.eventHook.ensureOnEvent)
				.onChange(async (value) => {
					config.settings.eventHook.ensureOnEvent = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.lockFreshSeconds.name)
		.setDesc(t.lockFreshSeconds.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.lockFreshSeconds.placeholder)
				.setValue(String(config.settings.eventHook.lockFreshSeconds))
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isNaN(parsed)) {
						return;
					}
					config.settings.eventHook.lockFreshSeconds = Math.max(3, parsed);
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.statusWaitMs.name)
		.setDesc(t.statusWaitMs.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.statusWaitMs.placeholder)
				.setValue(String(config.settings.eventHook.statusWaitMs))
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isNaN(parsed)) {
						return;
					}
					config.settings.eventHook.statusWaitMs = Math.max(300, parsed);
					await config.save();
					}),
		);
}

async function openFolderInExplorer(path: string): Promise<boolean> {
	const candidate = shell as unknown as ElectronShellLike;
	if (typeof candidate.openPath !== "function") {
		return false;
	}
	const errorMessage = await candidate.openPath(path);
	return !errorMessage;
}
