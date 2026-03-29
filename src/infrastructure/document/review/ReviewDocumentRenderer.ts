import { Section } from "md-ast-core";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { ReviewFlagLabelResolver } from "../../../application/review/services/ReviewFlagLabelResolver";
import { TimetableBuilder } from "../../../application/review/builders/TimetableBuilder";
import { UnfinishedTasksBuilder } from "../../../application/review/builders/UnfinishedTasksBuilder";
import { TimeAnalysisBuilder } from "../../../application/review/builders/TimeAnalysisBuilder";
import { WeeklyTrendTableBuilder } from "../../../application/review/builders/WeeklyTrendTableBuilder";
import { ReviewDailyTrendStat } from "../../../application/review/dto/ReviewDailyTrendStat";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";

export class ReviewDocumentRenderer {
  private readonly timetable: TimetableBuilder;
  private readonly unfinished: UnfinishedTasksBuilder;
  private readonly analysis: TimeAnalysisBuilder;
  private readonly weeklyTrend: WeeklyTrendTableBuilder;

  constructor() {
    const flagResolver = new ReviewFlagLabelResolver();
    this.timetable = new TimetableBuilder(flagResolver);
    this.unfinished = new UnfinishedTasksBuilder();
    this.analysis = new TimeAnalysisBuilder();
    this.weeklyTrend = new WeeklyTrendTableBuilder();
  }

  render(
    reviewSection: Section,
    tree: ReviewTaskTree,
    trendStats: ReviewDailyTrendStat[],
  ): void {
    const timetableHeading = HeadingService.resolve(
      "daily.section.timetable.title",
    );
    const unfinishedHeading = HeadingService.resolve(
      "daily.section.unfinished.title",
    );
    const analysisHeading = HeadingService.resolve(
      "daily.section.timeanalysis.title",
    );
    const trendHeading = HeadingService.resolve("daily.section.trend.title");

    reviewSection.appendChild({
      title: timetableHeading.renderedTitle,
      depth: timetableHeading.depth,
      content: () => this.timetable.build(tree),
    });

    // reviewSection.appendChild({
    //   position: "after",
    //   title: unfinishedHeading.renderedTitle,
    //   depth: unfinishedHeading.depth,
    //   content: () => this.unfinished.build(tree),
    // });

    reviewSection.appendChild({
      title: analysisHeading.renderedTitle,
      depth: analysisHeading.depth,
      content: () => this.analysis.build(tree),
    });

    reviewSection.appendChild({
      title: trendHeading.renderedTitle,
      depth: trendHeading.depth,
      content: () => this.weeklyTrend.build(trendStats),
    });
  }
}
