import { ja } from "./ja";

/**
 * Convert literal string types to string
 */
type LiteralToString<T> = T extends string
	? string
	: { [K in keyof T]: LiteralToString<T[K]> };

export type I18nSchema = LiteralToString<typeof ja>;
