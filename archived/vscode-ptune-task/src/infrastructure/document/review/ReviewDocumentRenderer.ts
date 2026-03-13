import { Section } from "md-ast-core";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { i18n } from "../../../shared/i18n/I18n";
import { ReviewFlagLabelResolver } from "../../../application/review/services/ReviewFlagLabelResolver";
import { TimetableBuilder } from "../../../application/review/builders/TimetableBuilder";
import { UnfinishedTasksBuilder } from "../../../application/review/builders/UnfinishedTasksBuilder";
import { TimeAnalysisBuilder } from "../../../application/review/builders/TimeAnalysisBuilder";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";

export class ReviewDocumentRenderer {
  private readonly timetable: TimetableBuilder;
  private readonly unfinished: UnfinishedTasksBuilder;
  private readonly analysis: TimeAnalysisBuilder;

  constructor() {
    const flagResolver = new ReviewFlagLabelResolver(i18n);
    this.timetable = new TimetableBuilder(flagResolver);
    this.unfinished = new UnfinishedTasksBuilder();
    this.analysis = new TimeAnalysisBuilder();
  }

  render(reviewSection: Section, tree: ReviewTaskTree): void {
    const timetableHeading = HeadingService.resolve(
      "daily.section.timetable.title",
      i18n,
    );
    const unfinishedHeading = HeadingService.resolve(
      "daily.section.unfinished.title",
      i18n,
    );
    const analysisHeading = HeadingService.resolve(
      "daily.section.timeanalysis.title",
      i18n,
    );

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
  }
}
