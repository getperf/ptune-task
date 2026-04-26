import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";

export type ReflectionBuildOptions = Record<string, string | undefined>;

export interface ReflectionFormatter {
  build(doc: DailyNotesReflectionDocument, options?: ReflectionBuildOptions): string;
  buildManual(options?: ReflectionBuildOptions): string;
  buildStructured(structured: StructuredReflectionText, options?: ReflectionBuildOptions): string;
  buildInput?(doc: DailyNotesReflectionDocument): string;
  buildStructuredInput?(structured: StructuredReflectionText): string;
}
