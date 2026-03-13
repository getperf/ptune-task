// src/application/sync/PullQuery.ts

export class PullQuery {
  readonly list: string;
  readonly date?: string;
  includeCompleted?: boolean;

  constructor(list: string, date?: string) {
    if (!list || list.trim() === "") {
      throw new Error("PullQuery: list is required");
    }

    this.list = list;
    this.date = date;
  }

  static today(): PullQuery {
    return new PullQuery("_Today");
  }
}
