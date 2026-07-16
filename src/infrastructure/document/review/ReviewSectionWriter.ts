import { DailyNoteDocumentAdapter } from "../adapter/DailyNoteDocumentAdapter";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { hdrAllowPrefixWith } from "md-ast-core";
import { ReviewDocumentRenderer } from "./ReviewDocumentRenderer";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";
import { HeadingMatcher } from "../matcher/HeadingMatcher";
import { ReviewDailyTrendStat } from "../../../application/review/dto/ReviewDailyTrendStat";

export class ReviewSectionWriter {
  constructor(private readonly adapter: DailyNoteDocumentAdapter, private readonly renderer = new ReviewDocumentRenderer()) {}
  appendReview(tree: ReviewTaskTree, timeLabel: string, trendStats: ReviewDailyTrendStat[]): void {
    const review = HeadingService.resolve("daily.section.review.title");
    const timelog = this.adapter.findOrCreateSection("daily.section.timelog.title");
    const existingReview = this.adapter.findSectionByMatcher(HeadingMatcher.review(review.baseTitle));
    const section = { title: `${review.renderedTitle}(${timeLabel})`, depth: review.depth, content: () => "" };
    if (existingReview) existingReview.insertBefore(section); else timelog.appendChild(section);
    const reviewSection = this.adapter.findSectionByMatcher(hdrAllowPrefixWith(review.baseTitle, "\\(" + timeLabel + "\\)"));
    if (!reviewSection) throw new Error("Failed to locate newly appended review section");
    this.renderer.render(reviewSection, tree, trendStats);
  }
}
