export interface NoteSummaryParams {
  notePath: string;
  createdAt: string;
  noteFolder: string;
  summary?: string | null;
  tags?: string[];
  dailynote?: string;
  taskKey?: string;
  goal?: string;
}

export class NoteSummary {
  readonly notePath: string;
  readonly createdAt: string;
  readonly noteFolder: string;
  readonly summary: string | null;
  readonly tags: string[];
  readonly dailynote?: string;
  readonly taskKey?: string;
  readonly goal?: string;

  constructor(params: NoteSummaryParams) {
    this.notePath = normalizePath(params.notePath);
    this.createdAt = params.createdAt;
    this.noteFolder = normalizePath(params.noteFolder);
    this.summary = params.summary ?? null;
    this.tags = [...(params.tags ?? [])];
    this.dailynote = params.dailynote;
    this.taskKey = params.taskKey;
    this.goal = params.goal;
  }

  get noteTitle(): string {
    const fileName = this.notePath.split("/").pop() ?? this.notePath;

    return fileName.replace(/\.md$/i, "").replace(/^[^_]+_/, "");
  }
}

function normalizePath(path: string): string {
  return path
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/");
}
