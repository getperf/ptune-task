// src/infrastructure/document/policy/FrontmatterMergePolicy.ts

import { TaskKeys } from "../../../domain/planning/TaskKeys";

export class FrontmatterMergePolicy {
  static union(
    existing: Record<string, string> | undefined,
    incoming: TaskKeys,
  ): Record<string, string> {
    return {
      ...(existing ?? {}),
      ...incoming,
    };
  }
}
