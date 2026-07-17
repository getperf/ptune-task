import { ConfigService } from "../ConfigService";
import { DEFAULT_SETTINGS } from "../defaults";
import type { Plugin } from "obsidian";

type PluginMock = Pick<Plugin, "loadData" | "saveData">;

function createPluginMock(data: unknown): PluginMock {
	return {
		loadData: jest.fn().mockResolvedValue(data),

		saveData: jest.fn().mockResolvedValue(undefined),
	};
}

describe("ConfigService", () => {
	test("load(): loadData が null の場合 DEFAULT_SETTINGS", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock(null) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings()).toEqual(DEFAULT_SETTINGS);
	});

	test("load(): partial settings merge", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			debug: true,
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings()).toMatchObject({
			...DEFAULT_SETTINGS,

			debug: true,
		});
	});

	test("load(): nested taskReview settings preserve defaults", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			taskReview: {
				trendDays: 14,
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().taskReview).toEqual({
			...DEFAULT_SETTINGS.taskReview,
			trendDays: 14,
		});
	});

	test("load(): nested projectIndex settings preserve defaults", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			projectIndex: {
				enableBasesSection: false,
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().projectIndex).toEqual({
			...DEFAULT_SETTINGS.projectIndex,
			enableBasesSection: false,
		});
	});

	test("load(): taskReview.trendDays falls back to legacy review.reviewTrendDays", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			review: {
				reviewTrendDays: 30,
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().taskReview.trendDays).toBe(30);
	});

	test("load(): explicit taskReview.trendDays overrides legacy review.reviewTrendDays", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			review: {
				reviewTrendDays: 30,
			},
			taskReview: {
				trendDays: 5,
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().taskReview.trendDays).toBe(5);
	});

	test("load(): dailyNoteTask.habit falls back to legacy habitTasks when not configured", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			habitTasks: {
				morning: ["<朝>起床🚫"],
				evening: ["<夜>プール🚫"],
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().dailyNoteTask?.habit).toEqual({
			morning: ["<朝>起床🚫"],
			evening: ["<夜>プール🚫"],
		});
	});

	test("load(): explicit dailyNoteTask.habit overrides legacy habitTasks", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock({
			habitTasks: {
				morning: ["<朝>起床🚫"],
				evening: ["<夜>プール🚫"],
			},
			dailyNoteTask: {
				habit: {
					morning: [],
					evening: [],
				},
			},
		}) as unknown as Plugin;

		await service.load(plugin);

		expect(service.getSettings().dailyNoteTask?.habit).toEqual({
			morning: [],
			evening: [],
		});
	});

	test("save(): saveData called", async () => {
		const service = new ConfigService();

		const plugin = createPluginMock(null) as unknown as Plugin;

		await service.load(plugin);

		await service.save();

		expect(plugin.saveData).toHaveBeenCalledTimes(1);
	});

	test("save(): plugin undefined", async () => {
		const service = new ConfigService();

		await service.save();

		expect(true).toBe(true);
	});
});
