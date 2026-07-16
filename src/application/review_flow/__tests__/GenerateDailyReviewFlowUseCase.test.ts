import { DailyNote } from "../../../domain/daily/DailyNote";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { GenerateDailyNotesReviewUseCase } from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { PullAndMergeTodayUseCase } from "../../sync/pull/PullAndMergeTodayUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import {
  DailyReviewCompletionPort,
  DailyReviewRequestPort,
  GenerateDailyReviewFlowUseCase,
} from "../usecases/GenerateDailyReviewFlowUseCase";

describe("GenerateDailyReviewFlowUseCase", () => {
  test("can skip both reviews independently", async () => {
    const note = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const pullAndMergeTodayUseCase = {
      execute: jest.fn(),
    } as unknown as PullAndMergeTodayUseCase;
    const taskReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn().mockResolvedValue({ note, created: false }),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: false,
      dailyNotesReviewEnabled: false,
      reviewPointOutputFormat: "outline",
    });

    expect(taskReviewUseCase.execute).not.toHaveBeenCalled();
    expect(pullAndMergeTodayUseCase.execute).not.toHaveBeenCalled();
    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(createDailyNoteUseCase.execute).toHaveBeenCalledWith("2026-03-16");
    expect(result).toEqual({
      note,
      taskReview: {
        executed: false,
        taskCount: 0,
      },
      dailyNotesReview: {
        executed: false,
        noteCount: 0,
        skippedReason: "disabled",
      },
    });
  });

  test("runs daily notes review without llm summaries when llm is unavailable", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "");
    const pullAndMergeTodayUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, created: false }),
    } as unknown as PullAndMergeTodayUseCase;
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 2 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: taskNote,
        noteCount: 3,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(false),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "outline",
    });

    expect(pullAndMergeTodayUseCase.execute).toHaveBeenCalledTimes(1);
    expect(taskReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      getDefaultTaskListId(),
    );
    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      expect.objectContaining({
        reviewPointOutputFormat: "outline",
        enableReflection: true,
      }),
    );
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 2,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 3,
      },
    });
  });

  test("runs daily notes review with selected format", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const finalNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "final");
    const pullAndMergeTodayUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, created: false }),
    } as unknown as PullAndMergeTodayUseCase;
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: finalNote,
        noteCount: 4,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
    });

    expect(pullAndMergeTodayUseCase.execute).toHaveBeenCalledTimes(1);
    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      expect.objectContaining({
        reviewPointOutputFormat: "xmind",
      }),
    );
    expect(result).toEqual({
      note: finalNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 4,
      },
    });
  });

  test("requests ptune-log daily notes review after task snapshot preparation", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const preparedTaskReview = {
      date: "2026-03-16",
      list: getDefaultTaskListId(),
      tasks: [],
      tree: {},
    };
    const pullAndMergeTodayUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, created: false }),
    } as unknown as PullAndMergeTodayUseCase;
    const prepare = jest.fn().mockResolvedValue(preparedTaskReview);
    const complete = jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 });
    const execute = jest.fn();
    const taskReviewUseCase = {
      execute,
      prepare,
      complete,
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;
    const requestDailyReview = jest.fn().mockResolvedValue({
      requestId: "request-1",
      status: "success",
      message: "accepted",
    });
    const dailyReviewRequestPort = {
      requestDailyReview,
    } as unknown as DailyReviewRequestPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
      dailyReviewRequestPort,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
    });

    expect(execute).not.toHaveBeenCalled();
    expect(prepare).toHaveBeenCalledWith("2026-03-16", getDefaultTaskListId());
    expect(requestDailyReview).toHaveBeenCalledWith({
      date: "2026-03-16",
      reviewPointOutputFormat: "xmind",
    });
    expect(complete).toHaveBeenCalledWith(preparedTaskReview);
    expect(prepare.mock.invocationCallOrder[0]).toBeLessThan(requestDailyReview.mock.invocationCallOrder[0]);
    expect(requestDailyReview.mock.invocationCallOrder[0]).toBeLessThan(complete.mock.invocationCallOrder[0]);
    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 0,
        requestedExternally: true,
        outcome: "completed",
      },
    });
  });

  test("skips external review request when explicitly suppressed", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const pullAndMergeTodayUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, created: false }),
    } as unknown as PullAndMergeTodayUseCase;
    const taskReviewUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn().mockResolvedValue({
        note: taskNote,
        noteCount: 4,
      }),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;
    const dailyReviewRequestPort = {
      requestDailyReview: jest.fn().mockResolvedValue({
        requestId: "request-ignored",
        status: "success",
        message: "accepted",
      }),
    } as unknown as DailyReviewRequestPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
      dailyReviewRequestPort,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
      skipExternalDailyReviewRequest: true,
    });

    expect(dailyReviewRequestPort.requestDailyReview).not.toHaveBeenCalled();
    expect(dailyNotesReviewUseCase.execute).toHaveBeenCalledWith(
      "2026-03-16",
      expect.objectContaining({
        reviewPointOutputFormat: "xmind",
      }),
    );
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 4,
      },
    });
  });

  test("waits for ptune-log review completion without local daily notes review", async () => {
    const taskNote = new DailyNote("2026-03-16", "daily/2026-03-16.md", "task");
    const preparedTaskReview = {
      date: "2026-03-16",
      list: getDefaultTaskListId(),
      tasks: [],
      tree: {},
    };
    const pullAndMergeTodayUseCase = {
      execute: jest.fn().mockResolvedValue({ note: taskNote, created: false }),
    } as unknown as PullAndMergeTodayUseCase;
    const taskReviewUseCase = {
      execute: jest.fn(),
      prepare: jest.fn().mockResolvedValue(preparedTaskReview),
      complete: jest.fn().mockResolvedValue({ note: taskNote, taskCount: 5 }),
    } as unknown as GenerateDailyReviewUseCase;
    const dailyNotesReviewUseCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyNotesReviewUseCase;
    const createDailyNoteUseCase = {
      execute: jest.fn(),
    } as unknown as CreateDailyNoteUseCase;
    const textGenerator = {
      hasValidApiKey: jest.fn().mockReturnValue(true),
    } as unknown as TextGenerationPort;
    const dailyReviewRequestPort = {
      requestDailyReview: jest.fn().mockResolvedValue({
        requestId: "request-1",
        status: "success",
        message: "accepted",
      }),
    } as unknown as DailyReviewRequestPort;
    const dailyReviewCompletionPort = {
      waitForDailyReviewCompleted: jest.fn().mockResolvedValue({
        outcome: "completed",
        reportSaved: true,
        message: "",
      }),
    } as unknown as DailyReviewCompletionPort;

    const useCase = new GenerateDailyReviewFlowUseCase(
      pullAndMergeTodayUseCase,
      taskReviewUseCase,
      dailyNotesReviewUseCase,
      createDailyNoteUseCase,
      textGenerator,
      dailyReviewRequestPort,
      dailyReviewCompletionPort,
    );

    const result = await useCase.execute({
      date: "2026-03-16",
      taskReviewEnabled: true,
      dailyNotesReviewEnabled: true,
      reviewPointOutputFormat: "xmind",
    });

    expect(dailyReviewRequestPort.requestDailyReview).toHaveBeenCalledWith({
      date: "2026-03-16",
      reviewPointOutputFormat: "xmind",
    });
    expect(dailyReviewCompletionPort.waitForDailyReviewCompleted).toHaveBeenCalledWith({
      requestId: "request-1",
      date: "2026-03-16",
    });
    expect(dailyNotesReviewUseCase.execute).not.toHaveBeenCalled();
    expect(result).toEqual({
      note: taskNote,
      taskReview: {
        executed: true,
        taskCount: 5,
      },
      dailyNotesReview: {
        executed: true,
        noteCount: 0,
        requestedExternally: true,
        outcome: "completed",
      },
    });
  });
});
