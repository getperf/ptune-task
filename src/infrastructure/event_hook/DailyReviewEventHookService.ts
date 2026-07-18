import { config } from "../../config/config";
import { EventHookEmitResult, EventHookService } from "./EventHookService";

export interface DailyReviewEventHookRequest { date: string; }

export class DailyReviewEventHookService {
  constructor(private readonly eventHookService: EventHookService) {}

  async requestDailyReview(request: DailyReviewEventHookRequest): Promise<EventHookEmitResult | null> {
    if (!config.settings.eventHook.enabled) return null;
    return this.eventHookService.emitDailyReviewRequested(request.date, { dailynote_key: request.date, updated_within_days: 3 });
  }

  async cancelDailyReview(request: { requestId: string; date: string }): Promise<{ status: string; message: string }> {
    return this.eventHookService.emitDailyReviewCancel(request.requestId, request.date);
  }
}
