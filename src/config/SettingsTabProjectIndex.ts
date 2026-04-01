import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

export function renderProjectIndexSettings(containerEl: HTMLElement) {
	const t = i18n.settings.projectIndex;

	containerEl.createEl("h2", { text: t.sectionTitle });

	new Setting(containerEl)
		.setName(t.enableBasesSection.name)
		.setDesc(t.enableBasesSection.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.projectIndex.enableBasesSection)
				.onChange(async (value) => {
					config.settings.projectIndex.enableBasesSection = value;
					await config.save();
				}),
		);
}
