import { config } from "../../config/config";
import {
	EventHookEmitResult,
	EventHookService,
} from "./EventHookService";

export interface DailyReviewEventHookRequest {
	date: string;
}

export class DailyReviewEventHookService {
	constructor(
		private readonly eventHookService: EventHookService,
	) {}

	async requestDailyReview(
		request: DailyReviewEventHookRequest,
	): Promise<EventHookEmitResult | null> {
		if (!config.settings.eventHook.enabled) {
			return null;
		}

		return await this.eventHookService.emitDailyReviewRequested(
			request.date,
			{
				dailynote_key: request.date,
				updated_within_days: 3,
			},
		);
	}
}
