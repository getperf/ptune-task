import { App } from "obsidian";
import { DailyNoteOpenHook } from "../../infrastructure/obsidian/DailyNoteOpenHook";
import { CalendarFactory } from "./CalendarFactory";

export class HookFactory {
  constructor(
    private readonly app: App,
    private readonly calendarFactory: CalendarFactory,
  ) {}

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return new DailyNoteOpenHook(
      this.app,
      this.calendarFactory.createEnsureTodayDailyNoteSectionsUseCase(),
    );
  }
}
