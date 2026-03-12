import { App } from "obsidian";

/**
 * Obsidian-specific context and operations.
 *
 * Encapsulates Obsidian App reference and Obsidian-specific behaviors:
 * - Path resolution (journal folder, note URI)
 * - Vault operations
 *
 * Separated from runtime to isolate Obsidian API dependencies and allow
 * alternative implementations (e.g., for testing).
 */
export class ObsidianContext {
  constructor(readonly app: App) { }

  /**
   * Resolve journal folder from Obsidian daily-notes plugin settings.
   * Returns vault-relative path or empty string if not configured.
   */
  resolveJournalDir(): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dailyNotes = (this.app as any).internalPlugins?.plugins?.["daily-notes"];
    const folder = dailyNotes?.instance?.options?.folder as string | undefined;
    return folder?.trim() || "";
  }

  /**
   * Resolve note URI for a given date (YYYY-MM-DD).
   * Returns path in format: {journalDir}/{date}.md
   */
  resolveNoteUri(date: string): string {
    const folder = this.resolveJournalDir();
    return folder ? `${folder}/${date}.md` : `${date}.md`;
  }
}
