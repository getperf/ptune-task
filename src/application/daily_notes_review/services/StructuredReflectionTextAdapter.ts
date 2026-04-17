import { DailyNotesReflectionDocument, ReflectionProject } from "../models/DailyNotesReflectionDocument";
import { logger } from "../../../shared/logger/loggerInstance";

const FOLDER_PREFIX = "[folder] ";
const NOTE_PREFIX = "[note] ";
const LEGACY_FOLDER_PREFIX = "[FOLDER] ";
const LEGACY_NOTE_PREFIX = "[NOTE] ";

export type StructuredReflectionNote = {
  noteTitle: string;
  sentences: string[];
};

export type StructuredReflectionFolder = {
  folderTitle: string;
  notes: StructuredReflectionNote[];
};

export type StructuredReflectionText = {
  folders: StructuredReflectionFolder[];
};

export class StructuredReflectionTextAdapter {
  constructor(private readonly doc: DailyNotesReflectionDocument) {}

  buildInput(): string {
    const lines: string[] = [];
    const folders = this.collectFolders();

    for (let folderIndex = 0; folderIndex < folders.length; folderIndex += 1) {
      const folder = folders[folderIndex];
      if (!folder) {
        logger.warn(
          `[Service] StructuredReflectionTextAdapter.buildInput missingFolder index=${folderIndex}`,
        );
        return lines.join("\n");
      }

      lines.push(`${FOLDER_PREFIX}${folder.projectTitle}`);
      for (let noteIndex = 0; noteIndex < folder.notes.length; noteIndex += 1) {
        const note = folder.notes[noteIndex];
        if (!note) {
          logger.warn(
            `[Service] StructuredReflectionTextAdapter.buildInput missingNote folderIndex=${folderIndex} noteIndex=${noteIndex}`,
          );
          return lines.join("\n");
        }

        lines.push(`${NOTE_PREFIX}${note.noteTitle}`);
        for (const sentence of note.sentences) {
          lines.push(`- ${sentence.text}`);
        }
      }

      if (folderIndex < folders.length - 1) {
        lines.push("");
      }
    }

    return lines.join("\n");
  }

  parseLoose(outputText: string): StructuredReflectionText | null {
    const parsed = this.parse(outputText);
    if (!parsed) {
      logger.warn("[Service] StructuredReflectionTextAdapter.parseLoose parseFailed");
      return null;
    }

    const noteCount = parsed.reduce((count, folder) => count + folder.notes.length, 0);
    const sentenceCount = parsed.reduce(
      (count, folder) => count + folder.notes.reduce((sum, note) => sum + note.sentences.length, 0),
      0,
    );

    if (parsed.length === 0 || noteCount === 0 || sentenceCount === 0) {
      logger.warn(
        `[Service] StructuredReflectionTextAdapter.parseLoose emptyStructure folders=${parsed.length} notes=${noteCount} sentences=${sentenceCount}`,
      );
      return null;
    }

    logger.debug(
      `[Service] StructuredReflectionTextAdapter.parseLoose parsed folders=${parsed.length} notes=${noteCount} sentences=${sentenceCount}`,
    );

    return {
      folders: parsed,
    };
  }

  private collectFolders(): ReflectionProject[] {
    return this.doc.projects;
  }

  private parse(outputText: string): StructuredReflectionFolder[] | null {
    const normalized = outputText
      .replace(/\r\n/g, "\n")
      .replace(/^```[a-zA-Z]*\s*/m, "")
      .replace(/\n```$/m, "")
      .trim();

    if (!normalized) {
      return null;
    }

    const lines = normalized
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .filter((line) => line.trim().length > 0);

    const result: StructuredReflectionFolder[] = [];
    let currentFolder: StructuredReflectionFolder | null = null;
    let currentNote: StructuredReflectionNote | null = null;

    for (const rawLine of lines) {
      const text = rawLine.trim();
      if (!text) {
        continue;
      }

      const folderPrefix = this.matchPrefix(text, [FOLDER_PREFIX, LEGACY_FOLDER_PREFIX]);
      if (folderPrefix) {
        currentFolder = {
          folderTitle: text.slice(folderPrefix.length).trim(),
          notes: [],
        };
        currentNote = null;
        result.push(currentFolder);
        continue;
      }

      const notePrefix = this.matchPrefix(text, [NOTE_PREFIX, LEGACY_NOTE_PREFIX]);
      if (notePrefix) {
        if (!currentFolder) {
          logger.debug(
            `[Service] StructuredReflectionTextAdapter.parse noteWithoutFolder line=${this.previewText(rawLine)}`,
          );
          return null;
        }

        currentNote = {
          noteTitle: text.slice(notePrefix.length).trim(),
          sentences: [],
        };
        currentFolder.notes.push(currentNote);
        continue;
      }

      if (!text.startsWith("- ") || !currentNote) {
        logger.debug(
          `[Service] StructuredReflectionTextAdapter.parse invalidLine line=${this.previewText(rawLine)}`,
        );
        return null;
      }

      currentNote.sentences.push(text.slice(2).trim());
    }

    return result.length > 0 ? result : null;
  }

  private previewText(value: string, maxLength = 120): string {
    return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  private matchPrefix(text: string, prefixes: readonly string[]): string | null {
    for (const prefix of prefixes) {
      if (text.startsWith(prefix)) {
        return prefix;
      }
    }

    return null;
  }
}
