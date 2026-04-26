import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";

export type ReviewPointArtifactLinks = Record<string, string>;

export interface ReviewPointArtifactProvider {
  prepareArtifactLinks(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<ReviewPointArtifactLinks>;
  writeInputFile?(note: DailyNote, content: string): Promise<ReviewPointArtifactLinks>;
}
