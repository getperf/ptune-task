import { TFile } from "obsidian";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { buildNoteSummarySystemPrompt } from "../prompts/buildNoteSummaryPrompt";
import { logger } from "../../../shared/logger/loggerInstance";
import { NoteSummaryFormatter } from "./NoteSummaryFormatter";

export type GeneratedNoteSummary = {
	summarySentences: string[];
	summarySegmentsMarkdown: string;
};

export class NoteSummaryGenerator {
	private static readonly MAX_INPUT_CHARS = 200000;
	private static readonly CHUNK_SIZE = 10000;
	private static readonly EMPTY_BODY_SUMMARY: GeneratedNoteSummary = {
		summarySentences: ["本文の記述なし。"],
		summarySegmentsMarkdown: "## 本文\n- 本文の記述なし。",
	};
	private readonly formatter = new NoteSummaryFormatter();

	constructor(
		private readonly generator: TextGenerationPort,
		private readonly repository: ProjectNoteFrontmatterRepository,
	) {}

	async generate(file: TFile): Promise<GeneratedNoteSummary> {
		logger.debug(
			`[Service] NoteSummaryGenerator.generate start path=${file.path}`,
		);

		const body = await this.repository.readBody(file);
		const normalizedBody = this.normalizeBody(body, file.path);
		if (!normalizedBody) {
			logger.warn(
				`[Service] NoteSummaryGenerator.generate emptyBody path=${file.path}`,
			);
			return NoteSummaryGenerator.EMPTY_BODY_SUMMARY;
		}

		if (normalizedBody.length > NoteSummaryGenerator.MAX_INPUT_CHARS) {
			// 分割要約
			const chunks = this.splitIntoChunks(
				normalizedBody,
				NoteSummaryGenerator.CHUNK_SIZE,
			);
			const chunkSummaries = await Promise.all(
				chunks.map((chunk) =>
					this.generator.generate(
						buildNoteSummarySystemPrompt(),
						chunk,
					),
				),
			);
			const combinedSummaries = chunkSummaries
				.map((output) =>
					this.formatter.formatWithSegments(output?.trim() ?? "").summarySentences,
				)
				.flat()
				.join("\n");

			// 結合した要約を最終要約
			const finalOutput = await this.generator.generate(
				buildNoteSummarySystemPrompt(),
				combinedSummaries,
			);
			const formatted = this.formatter.formatWithSegments(finalOutput?.trim() ?? "");

			if (formatted.summarySentences.length === 0) {
				throw new Error(`Empty summary generated for ${file.path}`);
			}

			logger.debug(
				`[Service] NoteSummaryGenerator.generate end path=${file.path} (chunked)`,
			);
			return formatted;
		} else {
			// 通常の要約
			const output = await this.generator.generate(
				buildNoteSummarySystemPrompt(),
				normalizedBody,
			);
			const formatted = this.formatter.formatWithSegments(output?.trim() ?? "");

			if (formatted.summarySentences.length === 0) {
				throw new Error(`Empty summary generated for ${file.path}`);
			}

			logger.debug(
				`[Service] NoteSummaryGenerator.generate end path=${file.path}`,
			);
			return formatted;
		}
	}

	private splitIntoChunks(text: string, chunkSize: number): string[] {
		const chunks: string[] = [];
		for (let i = 0; i < text.length; i += chunkSize) {
			chunks.push(text.slice(i, i + chunkSize));
		}
		return chunks;
	}

	private normalizeBody(body: string, path: string): string {
		const normalized = body.trim();
		logger.debug(
			`[Service] NoteSummaryGenerator.generate bodyChars=${normalized.length} path=${path}`,
		);

		return normalized;
	}
}
