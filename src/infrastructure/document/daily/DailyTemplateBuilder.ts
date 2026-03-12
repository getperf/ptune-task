import { MarkdownFile } from "md-ast-core";
import { i18n } from "../../../shared/i18n/I18n";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { PlannedTaskSectionBuilder } from "../../../application/planning/builders/PlannedTaskSectionBuilder";

export interface DailyTemplateOptions {
  morningHabits: string[];
  eveningHabits: string[];
}

export class DailyTemplateBuilder {

  build(
    options: DailyTemplateOptions,
  ): string {

    const md = MarkdownFile.createEmpty();

    const heading = HeadingService.resolve("daily.section.planned.title");

    md.root().appendChild({
      title: heading.renderedTitle,
      depth: heading.depth,
      content: () =>
        PlannedTaskSectionBuilder.build({
          commentLine1: i18n.common.daily.planned.comment.line1,
          commentLine2: i18n.common.daily.planned.comment.line2,
          morningHabits: options.morningHabits,
          eveningHabits: options.eveningHabits,
          keepExistingHabits: false,
        }),
    });

    return md.toString();
  }
}