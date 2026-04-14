// src/domain/planning/TaskDocument.ts

import { TaskEntry } from "./TaskEntry";
import { DeletedTaskEntry } from "./DeletedTaskEntry";

/**
 * Representation of a task inside the JSON document that is persisted to disk.
 *
 * The field names use snake_case (as required by the external storage format),
 * but otherwise the shape mirrors `TaskEntry`.  We build this type by taking
 * the camel‑cased `TaskEntry` and mapping just the three properties whose names
 * differ.  Exporting the type lets callers such as normalizers refer to it and
 * keeps the shape in a single location.
 */
export type TaskDocumentTask =
  Omit<TaskEntry, "parentId" | "parentKey" | "pomodoroPlanned"> & {
    parent: string | null;
    parent_key: string | null;
    pomodoro_planned: number | null;
  };

export interface TaskDocument {
  schemaVersion: number;
  tasks: TaskDocumentTask[];
  deletedTasks: DeletedTaskEntry[];
}

type RawTaskDocument = {
  schema_version: number;
  tasks: TaskDocumentTask[];
  deleted_tasks?: DeletedTaskEntry[];
};

function isRawTaskDocument(value: unknown): value is RawTaskDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.schema_version === "number" && Array.isArray(candidate.tasks);
}

export class TaskDocumentFactory {
  static fromJson(json: string): TaskDocument {
    const obj: unknown = JSON.parse(json);

    if (!isRawTaskDocument(obj)) {
      throw new Error("Invalid TaskDocument JSON");
    }

    return {
      schemaVersion: obj.schema_version,
      tasks: obj.tasks,
      deletedTasks: Array.isArray(obj.deleted_tasks) ? obj.deleted_tasks : [],
    };
  }
}
