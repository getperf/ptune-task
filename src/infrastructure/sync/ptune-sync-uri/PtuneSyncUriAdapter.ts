import {
  DiffData,
  DiffResult,
} from "../../../application/sync/shared/dto/DiffResult";
import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { getDefaultTaskListId } from "../../../application/sync/shared/DefaultTaskListId";
import { PtuneSyncPort } from "../../../application/sync/shared/ports/PtuneSyncPort";
import { PtuneSyncClient } from "../shared/PtuneSyncClient";
import { PtuneSyncCommandResultMapper } from "./PtuneSyncCommandResultMapper";

type ExportLikeResult = {
  schema_version: number;
  list: string;
  exported_at: string;
  tasks: unknown[];
};

export class PtuneSyncUriAdapter implements PtuneSyncPort {
  constructor(private readonly client: PtuneSyncClient) {}

  async pull(query: PullQuery): Promise<string> {
    const result = PtuneSyncCommandResultMapper.fromDto(
      await this.client.pull<ExportLikeResult>(query),
    );

    if (!result.data) {
      throw new Error("Missing pull data");
    }

    return JSON.stringify(result.data);
  }

  async review(query: ReviewQuery): Promise<string> {
    const result = PtuneSyncCommandResultMapper.fromDto(
      await this.client.review<ExportLikeResult>(query),
    );

    if (!result.data) {
      throw new Error("Missing review data");
    }

    return JSON.stringify(result.data);
  }

  async diff(payload: string): Promise<DiffResult> {
    const result = PtuneSyncCommandResultMapper.fromDto(await this.client.diff<DiffData>(payload, {
      list: getDefaultTaskListId(),
    }));

    const summary = result.data?.summary ?? {
      create: 0,
      update: 0,
      delete: 0,
      errors: 0,
      warnings: 0,
    };

    return new DiffResult(
      result.ok,
      summary,
      result.data?.errors ?? [],
      result.data?.warnings ?? [],
      result.errorMessage,
    );
  }

  async push(payload: string, query: PushQuery): Promise<void> {
    const result = PtuneSyncCommandResultMapper.fromDto(
      await this.client.push<{ accepted: number }>(payload, query),
    );

    if (!result.ok) {
      throw new Error(result.errorMessage ?? "ptune-sync push failed");
    }
  }
}
