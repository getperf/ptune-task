// src/task-io/transforms/markdown/MarkdownTaskListParser.ts

import { ParsedTaskNode } from "../../../../domain/planning/dto/ParsedTaskNode.js";
import { Logger } from "../../../../shared/logger/Logger.js";
import { TaskLineMetaParser } from "./TaskLineMetaParser.js";
import { TaskListMdastExtractor } from "./TaskListMdastExtractor.js";

export class MarkdownTaskListParser {
  static parse(body: string): ParsedTaskNode[] {
    const logger = Logger.get();
    const mdastLines = TaskListMdastExtractor.extract(body);

    const nodes: ParsedTaskNode[] = [];
    const stack: { depth: number; title: string }[] = [];

    for (const line of mdastLines) {
      const meta = TaskLineMetaParser.parse(line.rawText);

      // depth調整
      while (stack.length > 0 && stack[stack.length - 1].depth >= line.depth) {
        stack.pop();
      }

      const parentTitle =
        stack.length > 0 ? stack[stack.length - 1].title : null;

      nodes.push({
        title: meta.title,
        parentTitle,
        pomodoroPlanned: meta.pomodoroPlanned,
        tags: meta.tags,
        goal: meta.goal,
      });

      stack.push({ depth: line.depth, title: meta.title });
    }
    return nodes;
  }
}
