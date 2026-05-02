import { summarizeCommandFailure } from "../summarizeCommandFailure";

describe("summarizeCommandFailure", () => {
	test("prefers Python exception line from stderr", () => {
		const stderr = [
			"Traceback (most recent call last):",
			"  File \"ptune_log/main.py\", line 10, in main",
			"[2026-05-01T23:31:45.946Z][info] [EventHook] daemon control command=status",
			"TOMLDecodeError: Unescaped '\\' in a string (at line 93, column 16)",
		].join("\n");

		expect(summarizeCommandFailure("", stderr)).toBe(
			"TOMLDecodeError: Unescaped '\\' in a string (at line 93, column 16)",
		);
	});

	test("matches module-qualified Python exception names", () => {
		const stderr = [
			"Traceback (most recent call last):",
			"  File \"json/decoder.py\", line 1, in raw_decode",
			"json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)",
		].join("\n");

		expect(summarizeCommandFailure("", stderr)).toBe(
			"json.decoder.JSONDecodeError: Expecting value: line 1 column 1 (char 0)",
		);
	});

	test("falls back to first non-empty stderr line", () => {
		expect(summarizeCommandFailure("stdout failure", "\n  stderr failure\n")).toBe(
			"stderr failure",
		);
	});
});
