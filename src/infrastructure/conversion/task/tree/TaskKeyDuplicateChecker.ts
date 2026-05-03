// src/task-io/builders/TaskKeyDuplicateChecker.ts

import { ParsedTaskNode } from "../../../../domain/task/dto/ParsedTaskNode";
import { i18n } from "../../../../shared/i18n/I18n";
import { TaskKeyService } from "./TaskKeyService";

export class TaskKeyDuplicateChecker {
  static validate(nodes: ParsedTaskNode[]): void {
    const seen = new Set<string>();

    for (const node of nodes) {
      const key = node.parentTitle
        ? TaskKeyService.buildChildKey(node.parentTitle, node.title)
        : TaskKeyService.buildRootKey(node.title);

      if (seen.has(key)) {
        throw new Error(
          i18n.common.daily.planned.error.duplicateName.replace(
            "{taskKey}",
            key,
          ),
        );
      }

      seen.add(key);
    }
  }
}
