/**
 * 作業ノート判定。ptune-log イベント（note-review-requested / note-attached）の対象を
 * 作業ノートに限定するための構造的判別子。
 *
 * note-create フローが付与する frontmatter `dailynote` を判別子に使う。
 * ProjectNoteFrontmatterRepository が `dailynote` を string として扱うのに合わせ、
 * 非空 string のみを作業ノートとみなす（boolean/number/null/欠落は非作業ノート）。
 */
export function isWorkNoteFrontmatter(
	frontmatter: Record<string, unknown> | undefined,
): boolean {
	const value = frontmatter?.["dailynote"];
	return typeof value === "string" && value.trim().length > 0;
}
