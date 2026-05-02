import { App } from "obsidian";
import { TodayResolver } from "../../../application/calendar/services/TodayResolver";
import { ReviewFlowRunOptions } from "../../../application/review_flow/types/ReviewFlowRunOptions";
import { DailyReviewFlowResult } from "../../../application/review_flow/types/DailyReviewFlowResult";
import { DailyReviewFlowProgressEvent } from "../../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { ReviewFlowOptionsResolver } from "../../../application/review_flow/services/ReviewFlowOptionsResolver";
import { GenerateDailyReviewFlowUseCase } from "../../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { config } from "../../../config/config";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { EventHookService } from "../../../infrastructure/event_hook/EventHookService";
import { PythonReviewConfigSyncService } from "../../../infrastructure/review/PythonReviewConfigSyncService";
import { ReviewCommand, ReviewPresenter } from "../ReviewCommand";

type ReviewCommandTestApi = {
  runWithHookAndTaskFirst: (
    options: ReviewFlowRunOptions,
    progress: ReviewProgressTestDouble,
  ) => Promise<DailyReviewFlowResult>;
};

type ReviewProgressTestDouble = {
  appendStatusLine: jest.Mock<void, [string]>;
  handleEvent: jest.Mock<void, [DailyReviewFlowProgressEvent]>;
};

describe("ReviewCommand", () => {
  beforeEach(() => {
    config.settings.eventHook.enabled = true;
  });

  test("hook-enabled flow emits daily-review-requested only once", async () => {
    const note = new DailyNote("2026-04-26", "daily/2026-04-26.md", "note");
    const todayResolver = {
      resolve: jest.fn().mockReturnValue("2026-04-26"),
    } as unknown as TodayResolver;
    const optionsResolver = {
      resolve: jest.fn(),
    } as unknown as ReviewFlowOptionsResolver;
    const useCase = {
      execute: jest.fn().mockResolvedValue({
        note,
        taskReview: { executed: false, taskCount: 0 },
        dailyNotesReview: { executed: true, noteCount: 1, generatedCount: 1 },
      }),
    } as unknown as GenerateDailyReviewFlowUseCase;
    const presenter = {
      app: {} as App,
      openNote: jest.fn().mockResolvedValue(undefined),
      refreshCalendar: jest.fn().mockResolvedValue(undefined),
      showInfo: jest.fn(),
      showError: jest.fn(),
      saveActiveEditor: jest.fn().mockResolvedValue(undefined),
    } as ReviewPresenter;
    const emitDailyReviewRequested = jest.fn().mockResolvedValue({
      requestId: "request-1",
      status: "success",
      message: "accepted",
    });
    const waitForDailyReviewApplied = jest.fn().mockResolvedValue({
      appliedCount: 1,
      reportGenerationRequested: false,
    });
    const eventHookService = {
      emitDailyReviewRequested,
      waitForDailyReviewApplied,
    } as unknown as EventHookService;
    const reviewConfigSyncService = {
      sync: jest.fn().mockResolvedValue({
        profilesFile: "/tmp/profiles.json",
        credentialsFile: "/tmp/credentials.json",
        profileId: "profile-1",
      }),
    } as unknown as PythonReviewConfigSyncService;

    const command = new ReviewCommand(
      todayResolver,
      optionsResolver,
      useCase,
      presenter,
      eventHookService,
      reviewConfigSyncService,
    );

    const options: ReviewFlowRunOptions = {
      date: "2026-04-26",
      taskReviewEnabled: false,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
    };

    const progress = {
      appendStatusLine: jest.fn<void, [string]>(),
      handleEvent: jest.fn<void, [DailyReviewFlowProgressEvent]>(),
    } as ReviewProgressTestDouble;

    const result = await (command as unknown as ReviewCommandTestApi).runWithHookAndTaskFirst(
      options,
      progress,
    );

    expect(emitDailyReviewRequested).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        taskReviewEnabled: false,
        dailyNotesReviewEnabled: true,
        skipExternalDailyReviewRequest: true,
      }),
      expect.any(Function),
    );
    expect(result.dailyNotesReview.executed).toBe(true);
  });
});
