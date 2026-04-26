import { ReviewCommand } from "../ReviewCommand";
import { ReviewFlowRunOptions } from "../../../application/review_flow/types/ReviewFlowRunOptions";
import { DailyReviewFlowResult } from "../../../application/review_flow/types/DailyReviewFlowResult";
import { DailyReviewFlowProgressEvent } from "../../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { config } from "../../../config/config";
import { DailyNote } from "../../../domain/daily/DailyNote";

describe("ReviewCommand", () => {
  beforeEach(() => {
    config.settings.eventHook.enabled = true;
  });

  test("hook-enabled flow emits daily-review-requested only once", async () => {
    const note = new DailyNote("2026-04-26", "daily/2026-04-26.md", "note");
    const todayResolver = { resolve: jest.fn().mockReturnValue("2026-04-26") };
    const optionsResolver = { resolve: jest.fn() };
    const useCase = {
      execute: jest.fn().mockResolvedValue({
        note,
        taskReview: { executed: false, taskCount: 0 },
        dailyNotesReview: { executed: true, noteCount: 1, generatedCount: 1 },
      }),
    } as any;
    const presenter = {
      app: {} as any,
      openNote: jest.fn().mockResolvedValue(undefined),
      refreshCalendar: jest.fn().mockResolvedValue(undefined),
      showInfo: jest.fn(),
      showError: jest.fn(),
      saveActiveEditor: jest.fn().mockResolvedValue(undefined),
    } as any;
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
    } as any;
    const reviewConfigSyncService = {
      sync: jest.fn().mockResolvedValue({
        profilesFile: "/tmp/profiles.json",
        credentialsFile: "/tmp/credentials.json",
        profileId: "profile-1",
      }),
    } as any;

    const command = new ReviewCommand(
      todayResolver as any,
      optionsResolver as any,
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
      appendStatusLine: jest.fn(),
      handleEvent: jest.fn(),
    } as any;

    const result = await (command as any).runWithHookAndTaskFirst(options, progress);

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
