import { summarizeCommandFailure } from "../summarizeCommandFailure";

describe("summarizeCommandFailure", () => {
	test("prefers TOMLDecodeError line from stderr", () => {
		const stderr = [
			"[2026-05-01T23:31:45.946Z][info] [EventHook] daemon control command=status",
			"TOMLDecodeError: Unescaped '\\' in a string (at line 93, column 16)",
		].join("\n");

		expect(summarizeCommandFailure("", stderr)).toBe(
			"TOMLDecodeError: Unescaped '\\' in a string (at line 93, column 16)",
		);
	});

	test("falls back to first non-empty stderr line", () => {
		expect(summarizeCommandFailure("stdout failure", "\n  stderr failure\n")).toBe(
			"stderr failure",
		);
	});
});
