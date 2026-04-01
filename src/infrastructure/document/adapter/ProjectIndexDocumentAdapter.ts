import { MarkdownFile, Section } from "md-ast-core";
import { HeadingMatcher } from "../matcher/HeadingMatcher";
import { i18n } from "../../../shared/i18n/I18n";

export class ProjectIndexDocumentAdapter {
  private readonly md: MarkdownFile;

  constructor(markdown: string) {
    this.md = MarkdownFile.parse(markdown);
  }

  findBasesSection(): Section | null {
    return this.md.findSection(HeadingMatcher.heading(this.getBasesSectionTitle()));
  }

  findOrCreateBasesSection(): Section {
    const title = this.getBasesSectionTitle();

    return this.md.root().ensureChild({
      matcher: HeadingMatcher.heading(title),
      title,
      depth: 2,
      content: () => "",
    });
  }

  upsertBasesSection(markdownBody: string): boolean {
    const normalized = markdownBody.trim();
    const section = this.findOrCreateBasesSection();
    const current = section.getContent({ format: "markdown" })?.trim() ?? "";

    if (current === normalized) {
      return false;
    }

    section.resetContent(normalized);
    return true;
  }

  toString(): string {
    return this.md.toString();
  }

  private getBasesSectionTitle(): string {
    return i18n.common.projectIndex.section.noteUpdateHistory.title;
  }
}
