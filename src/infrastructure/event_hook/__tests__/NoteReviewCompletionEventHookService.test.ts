jest.mock("fs/promises", () => ({
	readFile: jest.fn(),
	rename: jest.fn().mockResolvedValue(undefined),
	mkdir: jest.fn().mockResolvedValue(undefined),
}));

import { readFile } from "fs/promises";
import { NoteReviewCompletionEventHookService } from "../NoteReviewCompletionEventHookService";

const readFileMock = readFile as jest.MockedFunction<typeof readFile>;

function notification(overrides: Record<string, unknown> = {}): string {
	return JSON.stringify({
		schema_version: 1,
		event_type: "note-review-completed",
		request_id: "req-1",
		payload: { scope: "note-review", outcome: "completed", message: "ok" },
		...overrides,
	});
}

function waitFor(raw: string) {
	readFileMock.mockResolvedValue(raw as unknown as Buffer);
	return new NoteReviewCompletionEventHookService().waitForNoteReviewCompleted({
		requestId: "req-1",
		notePath: "note.md",
	});
}

describe("NoteReviewCompletionEventHookService", () => {
	beforeEach(() => {
		readFileMock.mockReset();
	});

	test("returns the completed outcome and message from a matching terminal", async () => {
		await expect(waitFor(notification())).resolves.toEqual({
			outcome: "completed",
			message: "ok",
		});
	});

	test("maps skipped and failed outcomes verbatim", async () => {
		await expect(
			waitFor(notification({ payload: { outcome: "skipped", message: "already summarized" } })),
		).resolves.toEqual({ outcome: "skipped", message: "already summarized" });

		await expect(
			waitFor(notification({ payload: { outcome: "failed", message: "boom" } })),
		).resolves.toEqual({ outcome: "failed", message: "boom" });
	});

	test("normalizes an unknown outcome to failed", async () => {
		await expect(
			waitFor(notification({ payload: { outcome: "weird" } })),
		).resolves.toMatchObject({ outcome: "failed" });
	});

	test("treats an unsupported schema_version as a failure", async () => {
		const result = await waitFor(notification({ schema_version: 2 }));
		expect(result.outcome).toBe("failed");
		expect(result.message).toContain("schema_version");
	});

	test("accepts a terminal that omits schema_version", async () => {
		await expect(
			waitFor(notification({ schema_version: undefined })),
		).resolves.toMatchObject({ outcome: "completed" });
	});
});
