import { config } from "../../config/config";
import { ReviewOutputFormat } from "../../config/types";
import { PythonReviewConfigSyncService } from "../review/PythonReviewConfigSyncService";
import {
	EventHookEmitResult,
	EventHookService,
} from "./EventHookService";

export interface DailyReviewEventHookRequest {
	date: string;
	reviewPointOutputFormat: ReviewOutputFormat;
}

export class DailyReviewEventHookService {
	constructor(
		private readonly eventHookService: EventHookService,
		private readonly reviewConfigSyncService: PythonReviewConfigSyncService,
	) {}

	async requestDailyReview(
		request: DailyReviewEventHookRequest,
	): Promise<EventHookEmitResult | null> {
		if (!config.settings.eventHook.enabled) {
			return null;
		}

		const synced = await this.reviewConfigSyncService.sync();
		return await this.eventHookService.emitDailyReviewRequested(
			request.date,
			{
				profiles_file: synced.profilesFile,
				credentials_file: synced.credentialsFile,
				profile_id: synced.profileId,
				dailynote_key: request.date,
				updated_within_days: 3,
			},
		);
	}
}
