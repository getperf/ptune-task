import { DailyNotesReflectionDocument, ReflectionSentence } from "../models/DailyNotesReflectionDocument";

type SentenceInput = {
  id: string;
  text: string;
};

type SentenceOutput = {
  id: string;
  summary: string;
};

type IndexedSentence = {
  id: string;
  sentence: ReflectionSentence;
};

export class SentenceSummaryAdapter {
  private readonly indexed: IndexedSentence[];

  constructor(private readonly doc: DailyNotesReflectionDocument) {
    this.indexed = this.collect();
  }

  extract(): SentenceInput[] {
    return this.indexed.map(({ id, sentence }) => ({
      id,
      text: sentence.text,
    }));
  }

  apply(outputText: string): void {
    let results: SentenceOutput[];
    try {
      results = JSON.parse(this.normalizeJson(outputText)) as SentenceOutput[];
    } catch {
      return;
    }

    const map = new Map(
      results
        .filter((result) => typeof result.id === "string" && typeof result.summary === "string")
        .map((result) => [result.id, result.summary.trim()]),
    );

    for (const { id, sentence } of this.indexed) {
      const summary = map.get(id);
      if (summary) {
        sentence.text = summary;
      }
    }
  }

  private collect(): IndexedSentence[] {
    const result: IndexedSentence[] = [];
    let index = 0;

    for (const project of this.doc.projects) {
      for (const note of project.notes) {
        for (const sentence of note.sentences) {
          result.push({
            id: `s${index++}`,
            sentence,
          });
        }
      }
    }

    return result;
  }

  private normalizeJson(value: string): string {
    return value
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");
  }
}
