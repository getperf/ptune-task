import { TaskEntry } from "../../../domain/task/TaskEntry";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";
import { buildTaskTree } from "../../planning/services/buildTaskTree";
import { generateTaskEntries } from "../../planning/services/generateTaskEntries";
import { renderTaskTree } from "../../planning/services/renderTaskTree";
import { MarkdownToJsonUseCase } from "../../planning/usecases/MarkdownToJsonUseCase";
import { MergeTaskTreeService } from "../merge/MergeTaskTreeService";
import { PullQuery } from "../shared/dto/PullQuery";

type EntryPayload = {
  entries?: TaskEntry[];
};

function isEntryPayload(value: unknown): value is EntryPayload {
  return typeof value === "object" && value !== null;
}

export class SyncService {

  constructor(
    private readonly syncPort: PtuneSyncPort,
    private readonly mergeService: MergeTaskTreeService,
  ) { }

  async pullEntries(query: PullQuery): Promise<TaskEntry[]> {
    const raw = await this.syncPort.pull(query);
    const payload: unknown = JSON.parse(raw);

    return generateTaskEntries(payload);
  }

  buildLocalEntries(markdown: string): TaskEntry[] {
    const json = MarkdownToJsonUseCase.execute(markdown);
    const parsed: unknown = JSON.parse(json);

    if (!isEntryPayload(parsed) || !Array.isArray(parsed.entries)) {
      return [];
    }

    return parsed.entries;
  }

  mergeEntries(localEntries: TaskEntry[], remoteEntries: TaskEntry[]) {
    const localTree = buildTaskTree(localEntries);
    const remoteTree = buildTaskTree(remoteEntries);

    const mergedTree = this.mergeService.merge(localTree, remoteTree);

    return renderTaskTree(mergedTree);
  }
}
