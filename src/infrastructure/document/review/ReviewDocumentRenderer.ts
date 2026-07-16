import { Section } from "md-ast-core";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { ReviewFlagLabelResolver } from "../../../application/review/services/ReviewFlagLabelResolver";
import { TimetableBuilder } from "../../../application/review/builders/TimetableBuilder";
import { TimeAnalysisBuilder } from "../../../application/review/builders/TimeAnalysisBuilder";
import { WeeklyTrendTableBuilder } from "../../../application/review/builders/WeeklyTrendTableBuilder";
import { ReviewDailyTrendStat } from "../../../application/review/dto/ReviewDailyTrendStat";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";

export class ReviewDocumentRenderer {
  private readonly timetable = new TimetableBuilder(new ReviewFlagLabelResolver());
  private readonly analysis = new TimeAnalysisBuilder();
  private readonly weeklyTrend = new WeeklyTrendTableBuilder();
  render(section: Section, tree: ReviewTaskTree, stats: ReviewDailyTrendStat[]): void {
    for (const [heading, content] of [[HeadingService.resolve("daily.section.timetable.title"), () => this.timetable.build(tree)], [HeadingService.resolve("daily.section.timeanalysis.title"), () => this.analysis.build(tree)], [HeadingService.resolve("daily.section.trend.title"), () => this.weeklyTrend.build(stats)]] as const) {
      section.appendChild({ title: heading.renderedTitle, depth: heading.depth, content });
    }
  }
}
