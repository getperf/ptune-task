// src/application/review/services/ReviewFlagLabelResolver.ts
import { I18n } from "../../../shared/i18n/I18n";
import type { I18nKey } from "../../../shared/i18n/dictionaries/ja";

export class ReviewFlagLabelResolver {
  constructor(private readonly i18n: I18n) { }

  resolve(flag: string): string {
    const key = `review.flag.${flag}` as I18nKey;

    try {
      const value = this.i18n.t(key);

      if (!value) {
        return this.i18n.t("review.flag.unknown");
      }

      return value;
    } catch {
      return this.i18n.t("review.flag.unknown");
    }
  }
}