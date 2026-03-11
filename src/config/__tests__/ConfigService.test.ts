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
