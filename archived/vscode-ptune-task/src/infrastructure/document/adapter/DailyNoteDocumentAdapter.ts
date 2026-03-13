import { MarkdownFile, Section } from "md-ast-core";
import { FrontmatterMergePolicy } from "../policy/FrontmatterMergePolicy";
import { TaskKeys } from "../../../domain/planning/TaskKeys";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { DailyHeadingKey } from "../../../domain/heading/DailyHeadingKeys";
import { i18n } from "../../../shared/i18n/I18n";
import { SyncPhase } from "../../../domain/sync/SyncPhase";
import { HeadingMatcher } from "../matcher/HeadingMatcher";

export class DailyNoteDocumentAdapter {

  private readonly md: MarkdownFile;

  constructor(markdown: string) {
    this.md = MarkdownFile.parse(markdown);
  }

  findSectionByMatcher(matcher: RegExp): Section | null {
    return this.md.findSection(matcher);
  }

  // =========================================================
  // Section: READ
  // =========================================================

  getSectionMarkdown(key: DailyHeadingKey): string {

    const section = this.findSection(key);

    if (!section) {
      return "";
    }

    return section.getContent({ format: "markdown" }) ?? "";
  }

  hasSection(key: DailyHeadingKey): boolean {
    return this.findSection(key) !== null;
  }

  // =========================================================
  // Section: MERGE
  // =========================================================

  mergeIntoSection(
    key: DailyHeadingKey,
    markdownBody: string
  ): void {

    const section = this.findOrCreateSection(key);

    const existing =
      section.getContent({ format: "markdown" });

    const merged =
      this.mergeMarkdown(existing, markdownBody);

    section.resetContent(merged);
  }

  // =========================================================
  // Section: REPLACE
  // =========================================================

  replaceSection(
    key: DailyHeadingKey,
    markdownBody: string
  ): void {

    const section = this.findOrCreateSection(key);

    section.resetContent(markdownBody);
  }

  // =========================================================
  // Frontmatter: READ
  // =========================================================

  getTaskKeys(): TaskKeys {

    const fm = this.md.getFrontmatter();

    const keys = fm.get<TaskKeys>("taskKeys");

    return keys ?? {};
  }

  getTaskKeysCount(): number {

    const keys = this.getTaskKeys();

    return Object.keys(keys ?? {}).length;
  }

  getSyncPhase(): SyncPhase | null {

    const fm = this.md.getFrontmatter();

    return fm.get<SyncPhase>("syncPhase") ?? null;
  }

  // =========================================================
  // Frontmatter: WRITE
  // =========================================================

  setSyncPhase(phase: SyncPhase): void {

    const fm = this.md.getFrontmatter();

    fm.set("syncPhase", phase);
  }

  // =========================================================
  // Frontmatter: MERGE
  // =========================================================

  mergeTaskKeys(taskKeys: TaskKeys): void {

    const fm = this.md.getFrontmatter();

    const existing =
      fm.get<Record<string, string>>("taskKeys");

    const merged =
      FrontmatterMergePolicy.union(
        existing,
        taskKeys
      );

    fm.set("taskKeys", merged);
  }

  // =========================================================
  // Frontmatter: REPLACE
  // =========================================================

  replaceTaskKeys(taskKeys: TaskKeys): void {

    const fm = this.md.getFrontmatter();

    fm.set("taskKeys", taskKeys);
  }

  // =========================================================
  // Output
  // =========================================================

  toString(): string {
    return this.md.toString();
  }

  // =========================================================
  // private helpers
  // =========================================================

  private findSection(
    key: DailyHeadingKey
  ): Section | null {

    const heading =
      HeadingService.resolve(key, i18n);

    return this.md.findSection(
      HeadingMatcher.heading(
        heading.baseTitle
      )
    );
  }

  findOrCreateSection(
    key: DailyHeadingKey
  ): Section {

    const heading =
      HeadingService.resolve(key, i18n);

    return this.md.root().ensureChild({
      matcher:
        HeadingMatcher.heading(
          heading.baseTitle
        ),
      title: heading.renderedTitle,
      depth: heading.depth,
      content: () => "",
    });
  }

  private mergeMarkdown(
    existing: string,
    incoming: string
  ): string {

    if (!existing?.trim()) {
      return incoming.trim();
    }

    return (
      existing.trimEnd() +
      "\n" +
      incoming.trimStart()
    );
  }
}