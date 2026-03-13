// src/domain/planning/TaskListRenderResult.ts

import { TaskKeys } from "./TaskKeys";

export interface TaskListRenderResult {
  taskListMarkdown: string;
  taskKeys: TaskKeys;
}
