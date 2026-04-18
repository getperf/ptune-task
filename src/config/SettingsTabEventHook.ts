import { App, ButtonComponent, Notice, Setting } from "obsidian";
import { shell } from "electron";
import { homedir } from "os";
import { join } from "path";
import { config } from "./config";
import { i18n } from "../shared/i18n/I18n";
import {
	DaemonState,
	EventHookService,
} from "../infrastructure/event_hook/EventHookService";

type ElectronShellLike = {
	openPath?: (targetPath: string) => Promise<string>;
};

export function renderEventHookSettings(containerEl: HTMLElement, app: App) {
	const t = i18n.settings.eventHook;
	const eventHookService = new EventHookService(app);
	let daemonControl: { setHookEnabled(value: boolean): void } | null = null;

	new Setting(containerEl).setName(t.heading).setHeading();

	new Setting(containerEl)
		.setName(t.enabled.name)
		.setDesc(t.enabled.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.eventHook.enabled)
				.onChange(async (value) => {
					config.settings.eventHook.enabled = value;
					await config.save();
					daemonControl?.setHookEnabled(value);
				}),
		);

	daemonControl = renderDaemonControlRow(
		containerEl,
		eventHookService,
		config.settings.eventHook.enabled,
	);

	new Setting(containerEl)
		.setName(t.interopRoot.name)
		.setDesc(t.interopRoot.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.interopRoot.placeholder)
				.setValue(config.settings.eventHook.interopRoot)
				.onChange(async (value) => {
					config.settings.eventHook.interopRoot = value.trim();
					await config.save();
				}),
		)
		.addButton((button) =>
			button
				.setIcon("folder-open")
				.setTooltip(t.interopRoot.openButton)
				.onClick(async () => {
					const interopRoot =
						config.settings.eventHook.interopRoot.trim() ||
						join(homedir(), ".codex-md-export");
					const opened = await openFolderInExplorer(interopRoot);
					if (!opened) {
						new Notice(t.interopRoot.openFailed);
					}
				}),
		);

	new Setting(containerEl)
		.setName(t.pythonExePath.name)
		.setDesc(t.pythonExePath.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.pythonExePath.placeholder)
				.setValue(config.settings.eventHook.pythonExePath)
				.onChange(async (value) => {
					config.settings.eventHook.pythonExePath = value.trim();
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.daemonArgs.name)
		.setDesc(t.daemonArgs.desc)
		.addTextArea((text) => {
			text
				.setPlaceholder(t.daemonArgs.placeholder)
				.setValue(config.settings.eventHook.daemonArgs)
				.onChange(async (value) => {
					config.settings.eventHook.daemonArgs = value.trim();
					await config.save();
				});
			text.inputEl.rows = 3;
			return text;
		});

	new Setting(containerEl)
		.setName(t.ensureOnEvent.name)
		.setDesc(t.ensureOnEvent.desc)
		.addToggle((toggle) =>
			toggle
				.setValue(config.settings.eventHook.ensureOnEvent)
				.onChange(async (value) => {
					config.settings.eventHook.ensureOnEvent = value;
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.lockFreshSeconds.name)
		.setDesc(t.lockFreshSeconds.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.lockFreshSeconds.placeholder)
				.setValue(String(config.settings.eventHook.lockFreshSeconds))
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isNaN(parsed)) {
						return;
					}
					config.settings.eventHook.lockFreshSeconds = Math.max(3, parsed);
					await config.save();
				}),
		);

	new Setting(containerEl)
		.setName(t.statusWaitMs.name)
		.setDesc(t.statusWaitMs.desc)
		.addText((text) =>
			text
				.setPlaceholder(t.statusWaitMs.placeholder)
				.setValue(String(config.settings.eventHook.statusWaitMs))
				.onChange(async (value) => {
					const parsed = Number.parseInt(value, 10);
					if (Number.isNaN(parsed)) {
						return;
					}
					config.settings.eventHook.statusWaitMs = Math.max(300, parsed);
					await config.save();
					}),
		);
}

function renderDaemonControlRow(
	containerEl: HTMLElement,
	eventHookService: EventHookService,
	initialHookEnabled: boolean,
) {
	const t = i18n.settings.eventHook;
	const controlSetting = new Setting(containerEl)
		.setName(t.daemonControl.name)
		.setDesc(t.daemonControl.desc);

	const statusEl = controlSetting.controlEl.createSpan({
		cls: "ptune-daemon-status-badge",
		text: t.daemonControl.status.unknown,
	});
	statusEl.setAttribute("aria-live", "polite");

	let isBusy = false;
	let cachedState: DaemonState = "unknown";
	let hookEnabled = initialHookEnabled;
	let startButton: ButtonComponent | null = null;
	let stopButton: ButtonComponent | null = null;
	let restartButton: ButtonComponent | null = null;

	controlSetting.addButton((button) => {
		startButton = button;
		button.setButtonText(t.daemonControl.start).onClick(async () => {
			await runAction("start");
		});
	});
	controlSetting.addButton((button) => {
		stopButton = button;
		button.setButtonText(t.daemonControl.stop).onClick(async () => {
			await runAction("stop");
		});
	});
	controlSetting.addButton((button) => {
		restartButton = button;
		button.setButtonText(t.daemonControl.restart).onClick(async () => {
			await runAction("restart");
		});
	});

	const setButtonsDisabled = (disabled: boolean) => {
		const locked = disabled || !hookEnabled;
		startButton?.setDisabled(locked || cachedState === "running");
		stopButton?.setDisabled(locked || cachedState === "stopped");
		restartButton?.setDisabled(locked || cachedState === "stopped");
	};

	const applyStatus = (
		state: DaemonState,
		pid: number | null,
		reason: string,
	) => {
		cachedState = state;
		const baseText =
			state === "running"
				? t.daemonControl.status.running
				: state === "stopped"
					? t.daemonControl.status.stopped
					: t.daemonControl.status.unknown;
		const suffix = pid && pid > 0 ? ` (pid ${pid})` : "";
		statusEl.textContent = `${baseText}${suffix}`;
		statusEl.dataset["state"] = state;
		statusEl.title = reason || baseText;
		setButtonsDisabled(isBusy);
	};

	const refreshStatus = async () => {
		const status = await eventHookService.getDaemonStatus();
		applyStatus(status.state, status.pid, status.reason);
	};

	const runAction = async (action: "start" | "stop" | "restart") => {
		if (isBusy) {
			return;
		}
		if (!hookEnabled) {
			new Notice(t.daemonControl.notice.disabled);
			return;
		}
		isBusy = true;
		setButtonsDisabled(true);
		try {
			const result =
				action === "start"
					? await eventHookService.startDaemon()
					: action === "stop"
						? await eventHookService.stopDaemon()
						: await eventHookService.restartDaemon();
			await refreshStatus();
			if (result.ok) {
				new Notice(
					action === "start"
						? t.daemonControl.notice.started
						: action === "stop"
							? t.daemonControl.notice.stopped
							: t.daemonControl.notice.restarted,
				);
				return;
			}
			const message = summarizeCommandFailure(result.stdout, result.stderr);
			if (action === "stop" && /not running/i.test(message)) {
				new Notice(t.daemonControl.notice.alreadyStopped);
				return;
			}
			new Notice(`${t.daemonControl.notice.failed}: ${message}`);
		} finally {
			isBusy = false;
			setButtonsDisabled(false);
		}
	};

	void refreshStatus();

	return {
		setHookEnabled(value: boolean) {
			hookEnabled = value;
			setButtonsDisabled(isBusy);
		},
	};
}

function summarizeCommandFailure(stdout: string, stderr: string): string {
	const firstLine = (value: string): string | null => {
		const line = value
			.split(/\r?\n/)
			.map((entry) => entry.trim())
			.find((entry) => entry.length > 0);
		return line ?? null;
	};
	return firstLine(stderr) ?? firstLine(stdout) ?? "unknown error";
}

async function openFolderInExplorer(path: string): Promise<boolean> {
	const candidate = shell as unknown as ElectronShellLike;
	if (typeof candidate.openPath !== "function") {
		return false;
	}
	const errorMessage = await candidate.openPath(path);
	return !errorMessage;
}
