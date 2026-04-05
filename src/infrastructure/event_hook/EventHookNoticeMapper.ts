import { i18n } from "../../shared/i18n/I18n";
import { EventHookEmitResult } from "./EventHookService";

export class EventHookNoticeMapper {
  map(result: EventHookEmitResult): string {
    const t = i18n.common.eventHook.notice;
    if (result.status === "timeout") {
      return t.timeout;
    }
    if (result.status === "error") {
      return `${t.errorPrefix}: ${result.message}`;
    }
    if (result.status === "skipped") {
      return result.message || t.skipped;
    }
    return result.message || t.success;
  }
}

