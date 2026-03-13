import { DailyNoteDocumentAdapter } from "../adapter/DailyNoteDocumentAdapter";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { i18n } from "../../../shared/i18n/I18n";
import { hdrAllowPrefixWith } from "md-ast-core";
import { ReviewDocumentRenderer } from "./ReviewDocumentRenderer";
import { ReviewTaskTree } from "../../../application/review/models/ReviewTaskTree";
import { HeadingMatcher } from "../matcher/HeadingMatcher";

export class ReviewSectionWriter {
  constructor(
    private readonly adapter: DailyNoteDocumentAdapter,
    private readonly renderer = new ReviewDocumentRenderer(),
  ) { }

  appendReview(tree: ReviewTaskTree, timeLabel: string): void {
    const review = HeadingService.resolve("daily.section.review.title", i18n);

    // 1) 親：タイムログ／メモを ensure
    const timelog = this.adapter.findOrCreateSection(
      "daily.section.timelog.title",
    );

    // 2) 既存 review 探索
    const existingReview =
      this.adapter.findSectionByMatcher(HeadingMatcher.review(review.baseTitle));
    const anchor = existingReview ?? timelog;
    const position = existingReview ? "before" : "after";

    // 3) review 見出し追加
    anchor.prependChild({
      title: `${review.renderedTitle}(${timeLabel})`,
      depth: review.depth,
      content: () => "",
    });

    // 4) 直近 review を取得
    const reviewSection = this.adapter.findSectionByMatcher(
      hdrAllowPrefixWith(review.baseTitle, "\\(" + timeLabel + "\\)"),
    );

    if (!reviewSection) {
      throw new Error("Failed to locate newly appended review section");
    }

    // 5) レポート群をレンダラに委譲（文書描画責務）
    this.renderer.render(reviewSection, tree);
  }
}
