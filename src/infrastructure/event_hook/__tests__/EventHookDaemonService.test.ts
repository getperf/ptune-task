import {
	buildDaemonControlArgs,
	DaemonControlResult,
	EventHookDaemonService,
} from "../EventHookDaemonService";

describe("buildDaemonControlArgs", () => {
	test("builds the new status command without legacy options", () => {
		expect(buildDaemonControlArgs("status", ["--json"])).toEqual([
			"-m",
			"ptune_log.main",
			"daemon",
			"status",
			"--json",
		]);
	});

	test("builds the manual start command with dedicated UI", () => {
		expect(buildDaemonControlArgs("start", ["--open-ui"])).toEqual([
			"-m",
			"ptune_log.main",
			"daemon",
			"start",
			"--open-ui",
		]);
	});

	test("does not add legacy interop or timeout options", () => {
		expect(buildDaemonControlArgs("stop")).toEqual([
			"-m", "ptune_log.main", "daemon", "stop",
		]);
	});
});

type DaemonInternals = {
	isDaemonLockFresh(lockPath: string, freshSeconds: number): Promise<boolean>;
	runDaemonControlCommand(
		command: "status" | "start" | "stop" | "restart",
		extraArgs?: string[],
	): Promise<DaemonControlResult>;
};

describe("EventHookDaemonService.ensureDaemonRunning", () => {
	test("accepts an old lock when CLI status reports running", async () => {
		const service = new EventHookDaemonService();
		const internals = service as unknown as DaemonInternals;
		jest.spyOn(internals, "isDaemonLockFresh").mockResolvedValue(false);
		jest.spyOn(service, "getDaemonStatus").mockResolvedValue({
			state: "running",
			pid: 123,
			reason: "pid running",
			ageSeconds: null,
		});
		const start = jest.spyOn(internals, "runDaemonControlCommand");

		await expect(service.ensureDaemonRunning("startup")).resolves.toBe(true);
		expect(start).not.toHaveBeenCalled();
	});

	test("recovers when another process wins the daemon start race", async () => {
		const service = new EventHookDaemonService();
		const internals = service as unknown as DaemonInternals;
		jest.spyOn(internals, "isDaemonLockFresh").mockResolvedValue(false);
		jest
			.spyOn(service, "getDaemonStatus")
			.mockResolvedValueOnce({
				state: "stopped",
				pid: null,
				reason: "lock missing",
				ageSeconds: null,
			})
			.mockResolvedValueOnce({
				state: "running",
				pid: 456,
				reason: "pid running",
				ageSeconds: null,
			});
		jest.spyOn(internals, "runDaemonControlCommand").mockResolvedValue({
			ok: false,
			code: 1,
			stdout: "daemon already running",
			stderr: "",
		});

		await expect(service.ensureDaemonRunning("startup")).resolves.toBe(true);
	});
});
