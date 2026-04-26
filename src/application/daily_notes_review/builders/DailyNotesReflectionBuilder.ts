import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { ReviewOutputFormat } from "../../../config/types";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";
import { ReflectionFormatter, ReflectionBuildOptions } from "../formatters/ReflectionFormatter";
import { OutlineReflectionFormatter } from "../formatters/OutlineReflectionFormatter";
import { XMindReflectionFormatter } from "../formatters/XMindReflectionFormatter";

export type DailyNotesReflectionBuildOptions = ReflectionBuildOptions;

const reflectionFormatters: Record<ReviewOutputFormat, ReflectionFormatter> = {
  outline: new OutlineReflectionFormatter(),
  xmind: new XMindReflectionFormatter(),
};

export class DailyNotesReflectionBuilder {
  buildManual(
    outputFormat: ReviewOutputFormat,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    return this.getFormatter(outputFormat).buildManual(options);
  }

  build(
    doc: DailyNotesReflectionDocument,
    outputFormat: ReviewOutputFormat,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    return this.getFormatter(outputFormat).build(doc, options);
  }

  buildStructured(
    structured: StructuredReflectionText,
    outputFormat: ReviewOutputFormat,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    return this.getFormatter(outputFormat).buildStructured(structured, options);
  }

  buildInput(doc: DailyNotesReflectionDocument, outputFormat: ReviewOutputFormat): string | undefined {
    return this.getFormatter(outputFormat).buildInput?.(doc);
  }

  buildStructuredInput(structured: StructuredReflectionText, outputFormat: ReviewOutputFormat): string | undefined {
    return this.getFormatter(outputFormat).buildStructuredInput?.(structured);
  }

  private getFormatter(outputFormat: ReviewOutputFormat): ReflectionFormatter {
    return reflectionFormatters[outputFormat];
  }
}
