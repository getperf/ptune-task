import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { CollectCreatedNotesUseCase } from "../../note_scan/usecases/CollectCreatedNotesUseCase";
import { NoteSummaryGenerator } from "../../note_review/services/NoteSummaryGenerator";
import { DailyNotesReflectionBuilder } from "../builders/DailyNotesReflectionBuilder";
import { DailyNotesReflectionDocumentBuilder } from "../builders/DailyNotesReflectionDocumentBuilder";
import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { DailyNotesReportBuilder } from "../builders/DailyNotesReportBuilder";
import { buildDailyNotesReflectionPrompt } from "../prompts/buildDailyNotesReflectionPrompt";
import {
  StructuredReflectionText,
  StructuredReflectionTextAdapter,
} from "../services/StructuredReflectionTextAdapter";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { CreatedProjectNoteRepository } from "../../../infrastructure/repository/CreatedProjectNoteRepository";
import { DailyNotesReviewWriter } from "../../../infrastructure/document/review/DailyNotesReviewWriter";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { config } from "../../../config/config";
import { logger } from "../../../shared/logger/loggerInstance";
import { ReviewOutputFormat } from "../../../config/types";
import { ReviewPointXMindTemplateService } from "../../../infrastructure/review/ReviewPointXMindTemplateService";
import { ReviewPointXMindInputFileService } from "../../../infrastructure/review/ReviewPointXMindInputFileService";

export type GenerateDailyNotesReviewResult = {
  note?: DailyNote;
  noteCount: number;
  generatedCount: number;
};

export type DailyNotesReviewProgress = {
  type: "targets_resolved" | "summary_generated" | "writing_report";
  total: number;
  completed: number;
  path?: string;
};

export type GenerateDailyNotesReviewOptions = {
  reviewPointOutputFormat?: ReviewOutputFormat;
  enableSummaries?: boolean;
  enableReflection?: boolean;
  onProgress?: (progress: DailyNotesReviewProgress) => void;
};

export class GenerateDailyNotesReviewUseCase {
  constructor(
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly dailyNoteRepository: DailyNoteRepository,
    private readonly collectUseCase: CollectCreatedNotesUseCase,
    private readonly createdRepo: CreatedProjectNoteRepository,
    private readonly noteRepo: ProjectNoteFrontmatterRepository,
    private readonly noteSummaryGenerator: NoteSummaryGenerator,
    private readonly textGenerator: TextGenerationPort,
    private readonly writer: DailyNotesReviewWriter,
    private readonly reportBuilder: DailyNotesReportBuilder,
    private readonly reviewPointXMindTemplateService?: ReviewPointXMindTemplateService,
    private readonly reviewPointXMindInputFileService?: ReviewPointXMindInputFileService,
    private readonly reflectionDocumentBuilder = new DailyNotesReflectionDocumentBuilder(),
    private readonly reflectionBuilder = new DailyNotesReflectionBuilder(),
  ) {}

  async execute(
    date: string,
    options?: GenerateDailyNotesReviewOptions,
  ): Promise<GenerateDailyNotesReviewResult> {
    logger.debug(`[UseCase:start] GenerateDailyNotesReviewUseCase date=${date}`);

    try {
      const files = this.createdRepo.findByDate(date);
      logger.debug(`[UseCase] GenerateDailyNotesReviewUseCase targets date=${date} count=${files.length}`);
      options?.onProgress?.({
        type: "targets_resolved",
        total: files.length,
        completed: 0,
      });

      let generatedCount = 0;

      const enableSummaries = options?.enableSummaries ?? true;

      if (enableSummaries) {
        for (const file of files) {
          if (await this.createdRepo.hasSummary(file)) {
            continue;
          }

          const generated = await this.noteSummaryGenerator.generate(file);
          await this.noteRepo.saveSummary(file, {
            summary: generated.summarySentences.join("\n"),
            summarySegmentsMarkdown: generated.summarySegmentsMarkdown,
          });
          generatedCount += 1;
          options?.onProgress?.({
            type: "summary_generated",
            total: files.length,
            completed: generatedCount,
            path: file.path,
          });
        }
      }

      const summaries = await this.collectUseCase.execute(date);

      if (summaries.getAll().length === 0) {
        logger.debug(`[UseCase:end] GenerateDailyNotesReviewUseCase date=${date} notes=0 generated=${generatedCount}`);
        return {
          note: undefined,
          noteCount: 0,
          generatedCount,
        };
      }

      const report = this.reportBuilder.build(summaries, {
        includeSummaries: true,
      });
      options?.onProgress?.({
        type: "writing_report",
        total: summaries.getAll().length,
        completed: generatedCount,
      });
      const { note } = await this.createDailyNoteUseCase.execute(date);
      const reflection = (options?.enableReflection ?? true)
        ? await this.buildReflection(
            summaries,
            note,
            options?.reviewPointOutputFormat ?? config.settings.review.reviewPointOutputFormat,
          )
        : "";
      const updated = this.writer.write(note, report, reflection);
      await this.dailyNoteRepository.save(updated);

      logger.debug(`[UseCase:end] GenerateDailyNotesReviewUseCase date=${date} notes=${summaries.getAll().length} generated=${generatedCount}`);

      return {
        note: updated,
        noteCount: summaries.getAll().length,
        generatedCount,
      };
    } catch (error) {
      logger.warn(
        `[UseCase] GenerateDailyNotesReviewUseCase failed date=${date} message=${this.resolveErrorMessage(error)}`,
        error,
      );
      throw error;
    }
  }

  private async buildReflection(
    summaries: NoteSummaries,
    note: DailyNote,
    outputFormat: ReviewOutputFormat,
  ): Promise<string> {
    const doc = this.reflectionDocumentBuilder.build(summaries);
    const xmindLinks = outputFormat === "xmind"
      ? await this.prepareXMindFiles(note)
      : {};

    if (!this.textGenerator.hasValidApiKey()) {
      return await this.finalizeManualReflectionOutput(doc, note, outputFormat, xmindLinks);
    }

    if (config.settings.review.sentenceMode !== "llm") {
      return await this.finalizeReflectionOutput(doc, note, outputFormat, xmindLinks);
    }

    const adapter = new StructuredReflectionTextAdapter(doc);
    const userPrompt = adapter.buildInput();
    const sentenceInputs = doc.projects.flatMap((project) => project.notes)
      .reduce((count, current) => count + current.sentences.length, 0);
    logger.debug(
      `[UseCase] GenerateDailyNotesReviewUseCase reflectionSentences=${sentenceInputs}`,
    );

    if (sentenceInputs === 0) {
      return await this.finalizeReflectionOutput(doc, note, outputFormat, xmindLinks);
    }

    const reflection = await this.textGenerator.generate(
      buildDailyNotesReflectionPrompt(),
      userPrompt,
    );

    if (reflection?.trim()) {
      logger.debug(
        `[UseCase] GenerateDailyNotesReviewUseCase reflectionResponse chars=${reflection.length}`,
      );
      const structured = adapter.parseLoose(reflection);
      logger.debug(
        `[UseCase] GenerateDailyNotesReviewUseCase reflectionParsed=${structured ? "true" : "false"}`,
      );
      if (structured) {
        return await this.finalizeStructuredReflectionOutput(
          structured,
          note,
          outputFormat,
          xmindLinks,
        );
      }
    } else {
      logger.warn("[UseCase] GenerateDailyNotesReviewUseCase reflectionResponse empty");
    }

    return await this.finalizeReflectionOutput(doc, note, outputFormat, xmindLinks);
  }

  private async prepareXMindFiles(note: DailyNote): Promise<{
    xmindFileLink?: string;
  }> {
    if (!this.reviewPointXMindTemplateService) {
      return {};
    }

    const xmindFile = await this.reviewPointXMindTemplateService.ensureForDailyNote(note);
    return {
      xmindFileLink: xmindFile.markdownLinkPath,
    };
  }

  private async finalizeReflectionOutput(
    doc: DailyNotesReflectionDocument,
    note: DailyNote,
    outputFormat: ReviewOutputFormat,
    links: { xmindFileLink?: string },
  ): Promise<string> {
    let xmindInputFileLink: string | undefined;

    if (outputFormat === "xmind" && this.reviewPointXMindInputFileService) {
      const inputText = this.reflectionBuilder.buildXmindInput(doc);
      const inputFile = await this.reviewPointXMindInputFileService.writeForDailyNote(note, inputText);
      xmindInputFileLink = inputFile.markdownLinkPath;
    }

    return this.reflectionBuilder.build(doc, outputFormat, {
      xmindFileLink: links.xmindFileLink,
      xmindInputFileLink,
    });
  }

  private async finalizeStructuredReflectionOutput(
    structured: StructuredReflectionText,
    note: DailyNote,
    outputFormat: ReviewOutputFormat,
    links: { xmindFileLink?: string },
  ): Promise<string> {
    let xmindInputFileLink: string | undefined;

    if (outputFormat === "xmind" && this.reviewPointXMindInputFileService) {
      const inputText = this.reflectionBuilder.buildStructuredXmindInput(structured);
      const inputFile = await this.reviewPointXMindInputFileService.writeForDailyNote(note, inputText);
      xmindInputFileLink = inputFile.markdownLinkPath;
    }

    return this.reflectionBuilder.buildStructured(structured, outputFormat, {
      xmindFileLink: links.xmindFileLink,
      xmindInputFileLink,
    });
  }

  private async finalizeManualReflectionOutput(
    doc: DailyNotesReflectionDocument,
    note: DailyNote,
    outputFormat: ReviewOutputFormat,
    links: { xmindFileLink?: string },
  ): Promise<string> {
    let xmindInputFileLink: string | undefined;

    if (outputFormat === "xmind" && this.reviewPointXMindInputFileService) {
      const inputText = this.reflectionBuilder.buildXmindInput(doc);
      const inputFile = await this.reviewPointXMindInputFileService.writeForDailyNote(note, inputText);
      xmindInputFileLink = inputFile.markdownLinkPath;
    }

    return this.reflectionBuilder.buildManual(outputFormat, {
      xmindFileLink: links.xmindFileLink,
      xmindInputFileLink,
    });
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "unknown";
  }
}
