import { App } from "obsidian";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../../../application/daily_notes_review/models/DailyNotesReflectionDocument";
import { config } from "../../../config/config";
import { ReviewPointXMindTemplateService } from "../ReviewPointXMindTemplateService";
import { SimpleZipArchive } from "../SimpleZipArchive";
import { buildXMindContentXmlTemplate } from "../XMindContentXml";

describe("ReviewPointXMindTemplateService", () => {
	const originalXmindTemplatePath = config.settings.review.xmindTemplatePath;

	afterEach(() => {
		config.settings.review.xmindTemplatePath = originalXmindTemplatePath;
	});

	test("generates an XMind file with Fact and outline template topics", async () => {
		config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";
		const files = new Set<string>(["_template/xmind/template_analysis.xmind"]);
		let written: ArrayBuffer | null = null;
		const template = new SimpleZipArchive([
			{
				filename: "content.xml",
				data: buildXMindContentXmlTemplate("template"),
			},
			{ filename: "metadata.json", data: Buffer.from("{}", "utf8") },
		]).toArrayBuffer();
		const app = {
			vault: {
				adapter: {
					exists: jest.fn<boolean, [string]>((path: string) => files.has(path)),
					readBinary: jest.fn().mockResolvedValue(template),
					writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>((path, data) => {
						files.add(path);
						written = data;
						return Promise.resolve();
					}),
				},
			},
		} as unknown as App;
		const outlineTemplateService = {
			loadOutline: jest.fn().mockResolvedValue([
				{
					title: "KPT",
					children: [{ title: "Keep", children: [] }],
				},
			]),
		};
		const service = new ReviewPointXMindTemplateService(
			app,
			outlineTemplateService as never,
		);
		const note = new DailyNote("2026-05-02", "_journal/2026/05/2026-05-02.md", "");
		const doc = new DailyNotesReflectionDocument([
			{
				projectTitle: "project",
				notes: [
					{
						noteTitle: "note",
						sentences: [{ text: "summary sentence" }],
					},
				],
			},
		]);

		await service.ensureForDailyNote(note, doc);

		expect(written).not.toBeNull();
		const output = SimpleZipArchive
			.fromArrayBuffer(written ?? new ArrayBuffer(0))
			.read("content.xml")
			.toString("utf8");
		expect(output).toContain("<title>2026-05-02</title>");
		expect(output).toContain("<title>Fact</title>");
		expect(output).toContain("<title>summary sentence</title>");
		expect(output).toContain("<title>KPT</title>");
		expect(output).toContain("<title>Keep</title>");
	});

	test("overwrites an existing generated XMind file when document content is provided", async () => {
		config.settings.review.xmindTemplatePath = "_template/xmind/template_analysis.xmind";
		const files = new Set<string>([
			"_template/xmind/template_analysis.xmind",
			"_journal/2026/05/2026-05-02_reviewpoint.xmind",
		]);
		let writeCount = 0;
		const template = new SimpleZipArchive([
			{
				filename: "content.xml",
				data: buildXMindContentXmlTemplate("template"),
			},
		]).toArrayBuffer();
		const app = {
			vault: {
				adapter: {
					exists: jest.fn<boolean, [string]>((path: string) => files.has(path)),
					readBinary: jest.fn().mockResolvedValue(template),
					writeBinary: jest.fn<Promise<void>, [string, ArrayBuffer]>(() => {
						writeCount += 1;
						return Promise.resolve();
					}),
				},
			},
		} as unknown as App;
		const service = new ReviewPointXMindTemplateService(
			app,
			{ loadOutline: jest.fn().mockResolvedValue([]) } as never,
		);
		const note = new DailyNote("2026-05-02", "_journal/2026/05/2026-05-02.md", "");
		const doc = new DailyNotesReflectionDocument([
			{
				projectTitle: "project",
				notes: [{ noteTitle: "note", sentences: [{ text: "updated" }] }],
			},
		]);

		await service.ensureForDailyNote(note, doc);

		expect(writeCount).toBe(1);
		expect(app.vault.adapter.readBinary).toHaveBeenCalledWith(
			"_template/xmind/template_analysis.xmind",
		);
	});
});
