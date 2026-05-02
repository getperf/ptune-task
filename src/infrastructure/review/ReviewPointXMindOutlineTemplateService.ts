import { App, normalizePath } from "obsidian";
import { config } from "../../config/config";
import { XMindOutlineNode, parseTabbedXMindOutline } from "./XMindOutline";
import { logger } from "../../shared/logger/loggerInstance";

export const DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE_PATH =
	"_template/xmind/review-outline-template.md";

export const DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE = [
	"<!--",
	"XMind 振り返りアウトラインテンプレート",
	"",
	"記述方法:",
	"- 1 行に 1 トピックを書きます。",
	"- 行頭のタブでネストを表現します。",
	"- ここに書いたトピックは、自動生成される Fact セクションの後ろに追加されます。",
	"- Fact はノートサマリセンテンスの貼り付け用に自動生成されるため、このファイルには書かないでください。",
	"- このファイルは XMind 8 形式の .xmind 生成に使います。",
	"-->",
	"",
	"KPT",
	"\tKeep",
	"\tProblem",
	"\tTry",
	"",
].join("\n");

export class ReviewPointXMindOutlineTemplateService {
	constructor(private readonly app: App) {}

	async ensureTemplateExists(createdPaths: string[]): Promise<string | null> {
		const templatePath = this.resolveTemplatePath();
		await this.ensureTemplateFolder(templatePath, createdPaths);

		if (await this.app.vault.adapter.exists(templatePath)) {
			return null;
		}

		logger.debug(
			`[Service] ReviewPointXMindOutlineTemplateService.createDefaultTemplate target=${templatePath} bytes=${DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE.length}`,
		);
		await this.app.vault.adapter.write(
			templatePath,
			DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE,
		);
		return templatePath;
	}

	async loadOutline(): Promise<XMindOutlineNode[]> {
		const templatePath = this.resolveTemplatePath();
		if (!(await this.app.vault.adapter.exists(templatePath))) {
			logger.warn(
				`[Service] ReviewPointXMindOutlineTemplateService.missing path=${templatePath}`,
			);
			return parseTabbedXMindOutline(DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE);
		}

		const content = await this.app.vault.adapter.read(templatePath);
		return parseTabbedXMindOutline(content);
	}

	private resolveTemplatePath(): string {
		return normalizePath(
			config.settings.review.xmindReviewOutlineTemplatePath
				|| DEFAULT_XMIND_REVIEW_OUTLINE_TEMPLATE_PATH,
		);
	}

	private async ensureTemplateFolder(
		templatePath: string,
		createdPaths: string[],
	): Promise<void> {
		const folderPath = templatePath.includes("/")
			? templatePath.slice(0, templatePath.lastIndexOf("/"))
			: "";
		if (!folderPath) {
			return;
		}

		let current = "";
		for (const part of folderPath.split("/")) {
			current = current ? normalizePath(`${current}/${part}`) : normalizePath(part);
			if (await this.app.vault.adapter.exists(current)) {
				continue;
			}
			await this.app.vault.createFolder(current);
			createdPaths.push(current);
		}
	}
}
