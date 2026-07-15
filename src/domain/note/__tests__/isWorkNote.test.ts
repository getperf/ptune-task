import { isWorkNoteFrontmatter } from "../isWorkNote";

describe("isWorkNoteFrontmatter", () => {
	test("non-empty string dailynote marks a work note", () => {
		expect(isWorkNoteFrontmatter({ dailynote: "2026-07-16" })).toBe(true);
	});

	test("empty or whitespace dailynote is not a work note", () => {
		expect(isWorkNoteFrontmatter({ dailynote: "" })).toBe(false);
		expect(isWorkNoteFrontmatter({ dailynote: "   " })).toBe(false);
	});

	test("missing dailynote is not a work note", () => {
		expect(isWorkNoteFrontmatter({ taskKey: "T-1" })).toBe(false);
		expect(isWorkNoteFrontmatter({})).toBe(false);
		expect(isWorkNoteFrontmatter(undefined)).toBe(false);
	});

	test("null dailynote is not a work note", () => {
		expect(isWorkNoteFrontmatter({ dailynote: null })).toBe(false);
	});

	test("non-string dailynote is not a work note", () => {
		expect(isWorkNoteFrontmatter({ dailynote: 20260716 })).toBe(false);
		expect(isWorkNoteFrontmatter({ dailynote: true })).toBe(false);
	});
});
