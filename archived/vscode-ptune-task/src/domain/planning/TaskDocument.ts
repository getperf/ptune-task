// src/domain/planning/TaskDocument.ts

import { TaskEntry } from "./TaskEntry";
import { DeletedTaskEntry } from "./DeletedTaskEntry";

export interface TaskDocument {
  schemaVersion: number;
  tasks: {
    id: string;
    title: string;
    parent: string | null;
    parent_key: string | null;
    pomodoro_planned: number | null;
    tags: string[];
    goal: string | null;
  }[];
  deletedTasks: DeletedTaskEntry[];
}

export class TaskDocumentFactory {
  static fromJson(json: string): TaskDocument {
    const obj = JSON.parse(json);

    if (typeof obj !== "object" || obj === null || !Array.isArray(obj.tasks)) {
      throw new Error("Invalid TaskDocument JSON");
    }

    return {
      schemaVersion: obj.schema_version,
      tasks: obj.tasks,
      deletedTasks: obj.deleted_tasks ?? [],
    };
  }
}
