import { Setting } from "obsidian";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";

export function renderReviewSettings(containerEl: HTMLElement) {
	const t = i18n.settings.review;

	containerEl.createEl("h2", { text: t.sectionTitle });

	new Setting(containerEl)
		.setName(t.notesReviewEnabledDefault.name)
		.setDesc(t.notesReviewEnabledDefault.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.review.notesReviewEnabledDefault)
				.onChange(async (value) => {
					config.settings.review.notesReviewEnabledDefault = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.reviewPointOutputFormat.name)
		.setDesc(t.reviewPointOutputFormat.desc)
		.addDropdown((dropdown) =>
			dropdown
				.addOptions({
					outline: t.reviewPointOutputFormat.options.outline,
					xmind: t.reviewPointOutputFormat.options.xmind,
					logseq: t.reviewPointOutputFormat.options.logseq,
				})
				.setValue(config.settings.review.reviewPointOutputFormat)
				.onChange(async (value) => {
					if (value !== "outline" && value !== "xmind" && value !== "logseq") {
						return;
					}

					config.settings.review.reviewPointOutputFormat = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.reviewTrendDays.name)
		.setDesc(t.reviewTrendDays.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.reviewTrendDays.placeholder)
				.setValue(config.settings.review.reviewTrendDays.toString())
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					const normalized = Number.isFinite(parsed)
						? Math.min(30, Math.max(1, parsed))
						: 7;

					config.settings.review.reviewTrendDays = normalized;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.maxSentences.name)
		.setDesc(t.maxSentences.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.maxSentences.placeholder)
				.setValue(config.settings.review.maxSentences.toString())
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					const normalized = Number.isFinite(parsed)
						? Math.max(0, parsed)
						: 0;

					config.settings.review.maxSentences = normalized;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.xmindTemplatePath.name)
		.setDesc(t.xmindTemplatePath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.xmindTemplatePath.placeholder)
				.setValue(config.settings.review.xmindTemplatePath)
				.onChange(async (value) => {
					config.settings.review.xmindTemplatePath =
						value.trim() || t.xmindTemplatePath.placeholder;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.xmindReviewOutlineTemplatePath.name)
		.setDesc(t.xmindReviewOutlineTemplatePath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.xmindReviewOutlineTemplatePath.placeholder)
				.setValue(config.settings.review.xmindReviewOutlineTemplatePath)
				.onChange(async (value) => {
					config.settings.review.xmindReviewOutlineTemplatePath =
						value.trim() || t.xmindReviewOutlineTemplatePath.placeholder;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.logseqRootPath.name)
		.setDesc(t.logseqRootPath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.logseqRootPath.placeholder)
				.setValue(config.settings.review.logseqRootPath)
				.onChange(async (value) => {
					config.settings.review.logseqRootPath = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.logseqJournalTemplatePath.name)
		.setDesc(t.logseqJournalTemplatePath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.logseqJournalTemplatePath.placeholder)
				.setValue(config.settings.review.logseqJournalTemplatePath)
				.onChange(async (value) => {
					config.settings.review.logseqJournalTemplatePath =
						value.trim() || t.logseqJournalTemplatePath.placeholder;
					await config.save();
				}),
		);
}
