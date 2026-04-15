import { MarkdownFile, Section } from "md-ast-core";
import type { Heading, Root, RootContent } from "mdast";
import { FrontmatterMergePolicy } from "../policy/FrontmatterMergePolicy";
import { TaskKeys } from "../../../domain/task/TaskKeys";
import { HeadingService } from "../../../domain/heading/HeadingService";
import { DailyHeadingKey } from "../../../domain/heading/DailyHeadingKeys";
import { SyncPhase } from "../../../domain/task/SyncPhase";
import { HeadingMatcher } from "../matcher/HeadingMatcher";

export class DailyNoteDocumentAdapter {
  private static readonly CORRUPTED_PHASE_HEADING_PATTERN =
    /^(planning|working)$/;
  private static readonly CORRUPTED_TASK_KEY_HEADING_PATTERN =
    /^[A-Za-z0-9\-_]{10,}$/;
  private static readonly CORRUPTED_LABELED_TASK_KEY_HEADING_PATTERN =
    /^.+:\s*[A-Za-z0-9\-_]{10,}$/;

  private readonly md: MarkdownFile;

  constructor(markdown: string) {
    this.md = MarkdownFile.parse(markdown);
  }

  findSectionByMatcher(matcher: RegExp): Section | null {
    return this.md.findSection(matcher);
  }

  removeSectionByMatcher(matcher: RegExp): boolean {
    const section = this.md.findSection(matcher);

    if (!section) {
      return false;
    }

    const range = section.getRange();
    const headingIndex = section.getIndex();

    const tree = getRootTree(this.md);

    tree.children.splice(
      headingIndex,
      range.contentEnd - headingIndex,
    );

    return true;
  }

  repairDanglingTaskKeyHeadingBeforePlannedSection(): boolean {
    const plannedSection = this.findSection("daily.section.planned.title");

    if (!plannedSection) {
      return false;
    }

    const tree = getRootTree(this.md);
    const plannedIndex = plannedSection.getIndex();
    const previousHeadingIndex = this.findPreviousHeadingIndex(tree, plannedIndex);

    if (previousHeadingIndex < 0) {
      return false;
    }

    const previousHeading = tree.children[previousHeadingIndex];

    if (!this.isRemovableCorruptedHeading(previousHeading, plannedSection)) {
      return false;
    }

    if (previousHeadingIndex + 1 !== plannedIndex) {
      return false;
    }

    tree.children.splice(previousHeadingIndex, plannedIndex - previousHeadingIndex);

    return true;
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

  upsertSection(
    key: DailyHeadingKey,
    markdownBody: string
  ): boolean {

    const normalized =
      markdownBody.trim();

    const current =
      this.getSectionMarkdown(key).trim();

    if (current === normalized) {
      return false;
    }

    this.replaceSection(key, markdownBody);

    return true;
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
      HeadingService.resolve(key);

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
      HeadingService.resolve(key);

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

  private findPreviousHeadingIndex(
    tree: Root,
    fromIndex: number,
  ): number {
    for (let index = fromIndex - 1; index >= 0; index -= 1) {
      if (tree.children[index]?.type === "heading") {
        return index;
      }
    }

    return -1;
  }

  private isRemovableCorruptedHeading(
    node: RootContent | undefined,
    plannedSection: Section,
  ): node is Heading {
    if (node?.type !== "heading") {
      return false;
    }

    if (node.depth !== plannedSection.getHeadingDepth()) {
      return false;
    }

    const title = this.extractHeadingText(node);

    return this.isCorruptedHeadingTitle(title);
  }

  private extractHeadingText(node: Heading): string {
    return node.children
      .map((child) => ("value" in child ? child.value : ""))
      .join("");
  }

  private isCorruptedHeadingTitle(title: string): boolean {
    return DailyNoteDocumentAdapter.CORRUPTED_PHASE_HEADING_PATTERN.test(title)
      || DailyNoteDocumentAdapter.CORRUPTED_TASK_KEY_HEADING_PATTERN.test(title)
      || DailyNoteDocumentAdapter.CORRUPTED_LABELED_TASK_KEY_HEADING_PATTERN.test(title);
  }
}

function getRootTree(md: MarkdownFile): Root {
  return (md.root() as unknown as { getTree(): Root }).getTree();
}
