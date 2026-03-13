import { I18n } from "../../shared/i18n/I18n";
import { DailyHeadingKey } from "./DailyHeadingKeys";
import { DailyHeadingConfig } from "./DailyHeadingConfig";
import { HeadingDepth } from "md-ast-core";

export type ResolvedHeading = {
  baseTitle: string;
  renderedTitle: string;
  depth: HeadingDepth;
};

export class HeadingService {
  static resolve(key: DailyHeadingKey, i18n: I18n): ResolvedHeading {
    const baseTitle = i18n.t(key);
    const meta = DailyHeadingConfig[key];

    return {
      baseTitle,
      renderedTitle: `${meta.icon} ${baseTitle}`,
      depth: meta.depth,
    };
  }
}