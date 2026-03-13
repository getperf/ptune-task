import * as vscode from "vscode";
import { ja, I18nKey } from "./dictionaries/ja";
import { en } from "./dictionaries/en";

type Dictionary = Record<I18nKey, string>;

export class I18n {
  private bundle: Dictionary = ja;

  init(): void {
    const locale = vscode.env.language;
    this.bundle = locale.startsWith("ja") ? ja : en;
  }

  t(key: I18nKey): string {
    return this.bundle[key];
  }
}

export const i18n = new I18n();