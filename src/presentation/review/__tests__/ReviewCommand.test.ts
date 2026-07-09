import { App } from "obsidian";
import { TodayResolver } from "../../../application/calendar/services/TodayResolver";
import { ReviewFlowOptionsResolver } from "../../../application/review_flow/services/ReviewFlowOptionsResolver";
import { GenerateDailyReviewFlowUseCase } from "../../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { ReviewCommand, ReviewPresenter } from "../ReviewCommand";

describe("ReviewCommand", () => {
  test("constructs without direct event hook collaborators", () => {
    const todayResolver = {
      resolve: jest.fn().mockReturnValue("2026-04-26"),
    } as unknown as TodayResolver;
    const optionsResolver = {
      resolve: jest.fn(),
    } as unknown as ReviewFlowOptionsResolver;
    const useCase = {
      execute: jest.fn(),
    } as unknown as GenerateDailyReviewFlowUseCase;
    const presenter = {
      app: {} as App,
      openNote: jest.fn(),
      refreshCalendar: jest.fn(),
      showInfo: jest.fn(),
      showError: jest.fn(),
      saveActiveEditor: jest.fn(),
    } as ReviewPresenter;

    const command = new ReviewCommand(
      todayResolver,
      optionsResolver,
      useCase,
      presenter,
    );

    expect(command).toBeInstanceOf(ReviewCommand);
  });
});
