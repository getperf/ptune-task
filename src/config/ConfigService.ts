import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./defaults";
import type { PluginSettings } from "./types";

export class ConfigService {
	private plugin?: Plugin;

	settings: PluginSettings = DEFAULT_SETTINGS;

	async load(plugin: Plugin) {
		this.plugin = plugin;

		const data =
			(await plugin.loadData()) as Partial<PluginSettings> | null;

		this.settings = {
			...DEFAULT_SETTINGS,
			...data,
		};
	}

	async save() {
		if (!this.plugin) return;

		await this.plugin.saveData(this.settings);
	}

	getSettings(): PluginSettings {
		return this.settings;
	}
}
