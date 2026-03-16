import { DailyNote } from "../../../domain/daily/DailyNote";
import { GenerateDailyNotesReviewUseCase } from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import { ReviewFlowOptionsResolver } from "../services/ReviewFlowOptionsResolver";
import { GenerateDailyReviewFlowUseCase } from "../usecases/GenerateDailyReviewFlowUseCase";

describe("GenerateDailyReviewFlowUseCase", () => {
  test("skips daily notes review when disabled", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 3 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const optionsResolver = {
      resolve: jest.fn().mockReturnValue({
        notesReviewEnabled: false,
        taskReviewOutputFormat: "outline",
      }),
    } as unknown as ReviewFlowOptionsResolver;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(false),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      optionsResolver,
      textGenerator,
    );

    const result = await useCase.execute("2026-03-16");

    expect(taskReviewUseCase.execute).toHaveBeenCalledWith(getDefaultTaskListId());
    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 3,
      },
      dailyNotesReview: {
        executed: false,
        noteCount: 0,
        generatedCount: 0,
        skippedReason: "disabled",
      },
    });
  });

  test("skips daily notes review when llm is unavailable", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 2 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const optionsResolver = {
      resolve: jest.fn().mockReturnValue({
        notesReviewEnabled: true,
        taskReviewOutputFormat: "outline",
      }),
    } as unknown as ReviewFlowOptionsResolver;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(false),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      optionsResolver,
      textGenerator,
    );

    const result = await useCase.execute("2026-03-16");

    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 2,
      },
      dailyNotesReview: {
        executed: false,
        noteCount: 0,
        generatedCount: 0,
        skippedReason: "llm-unavailable",
      },
    });
  });

  test("runs daily notes review when enabled and llm is available", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const finalNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "final");
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: finalNote,
        noteCount: 4,
        generatedCount: 3,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const optionsResolver = {
      resolve: jest.fn().mockReturnValue({
        notesReviewEnabled: true,
        taskReviewOutputFormat: "outline",
      }),
    } as unknown as ReviewFlowOptionsResolver;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      optionsResolver,
      textGenerator,
    );

    const result = await useCase.execute("2026-03-16");

    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith("2026-03-16");
    expect(result).toEqual({
      note: finalNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 4,
        generatedCount: 3,
      },
    });
  });
});
