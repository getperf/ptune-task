import { App } from "obsidian";
import { EnsureProjectIndexBasesSectionUseCase } from "../../application/project/usecases/EnsureProjectIndexBasesSectionUseCase";
import { ProjectIndexBasesTemplateBuilder } from "../../infrastructure/document/project/ProjectIndexBasesTemplateBuilder";
import { DailyNoteOpenHook } from "../../infrastructure/obsidian/DailyNoteOpenHook";
import { LayoutReadyHook } from "../../infrastructure/obsidian/LayoutReadyHook";
import { LayoutRelocator } from "../../infrastructure/obsidian/LayoutRelocator";
import { ProjectIndexOpenHook } from "../../infrastructure/obsidian/ProjectIndexOpenHook";
import { ProjectRepository } from "../../infrastructure/repository/ProjectRepository";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { CalendarFactory } from "./CalendarFactory";

export class HookFactory {
  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
  ) {}

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return new DailyNoteOpenHook(
      this.app,
      this.calendarFactory.createEnsureTodayDailyNoteSectionsUseCase(),
    );
  }

  createLayoutReadyHook(): LayoutReadyHook {
    return new LayoutReadyHook(this.app, new LayoutRelocator(this.app));
  }

  createProjectIndexOpenHook(): ProjectIndexOpenHook {
    return new ProjectIndexOpenHook(
      this.app,
      new EnsureProjectIndexBasesSectionUseCase(
        new ProjectRepository(this.runtime, this.app),
        new ProjectIndexBasesTemplateBuilder(),
        () => this.app.internalPlugins?.plugins?.bases?.enabled ?? false,
      ),
    );
  }
}
