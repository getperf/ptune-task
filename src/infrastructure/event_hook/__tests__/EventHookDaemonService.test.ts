import { normalizeDaemonArgsForEnsure } from "../EventHookDaemonService";

describe("normalizeDaemonArgsForEnsure", () => {
	test("keeps current foreground args", () => {
		expect(
			normalizeDaemonArgsForEnsure([
				"-m",
				"ptune_log.main",
				"daemon",
				"foreground",
				"--debug",
			]),
		).toEqual(["-m", "ptune_log.main", "daemon", "foreground", "--debug"]);
	});

	test("inserts foreground for legacy ptune_log daemon args", () => {
		expect(
			normalizeDaemonArgsForEnsure([
				"-m",
				"ptune_log.main",
				"daemon",
				"--debug",
			]),
		).toEqual(["-m", "ptune_log.main", "daemon", "foreground", "--debug"]);
	});

	test("renames legacy codex module and inserts foreground", () => {
		expect(
			normalizeDaemonArgsForEnsure([
				"-m",
				"codex_md_export.main",
				"daemon",
				"--debug",
			]),
		).toEqual(["-m", "ptune_log.main", "daemon", "foreground", "--debug"]);
	});

	test("keeps explicit control subcommand", () => {
		expect(
			normalizeDaemonArgsForEnsure([
				"-m",
				"ptune_log.main",
				"daemon",
				"start",
			]),
		).toEqual(["-m", "ptune_log.main", "daemon", "start"]);
	});
});
