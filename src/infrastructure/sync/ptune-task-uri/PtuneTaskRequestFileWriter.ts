import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { App, normalizePath } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

interface PreparedRequestFiles {
	requestNonce: string;
	requestFile: string;
	statusFile: string;
}

interface PreparedTaskRequestFiles extends PreparedRequestFiles {
	inputFile: string;
}

export class PtuneTaskRequestFileWriter {
	constructor(
		private readonly app: App,
		private readonly workDir: PtuneTaskWorkDir,
	) {}

	async write(
		command: "auth-status" | "auth-login",
	): Promise<PreparedRequestFiles> {
		await this.workDir.ensureInteropDirExists();

		const requestNonce = this.generateRequestNonce();
		const requestFile = this.workDir.getRequestFileRelative();
		const home = this.workDir.getRootAbsolute();
		const statusFile = this.workDir.getStatusFileAbsolute();
		const requestPayload = {
			schema_version: 1,
			request_nonce: requestNonce,
			command,
			created_at: new Date().toISOString(),
			home,
			status_file: statusFile,
			workspace: {
				status_file: statusFile,
			},
		};

		await this.writeAtomic(
			requestFile,
			JSON.stringify(requestPayload, null, 2),
		);

		logger.debug(
			`[Sync] [PtuneTaskRequestFileWriter] command=${command} requestNonce=${requestNonce} requestFile=${requestFile}`,
		);

		return {
			requestNonce,
			requestFile: this.workDir.getRequestFileAbsolute(),
			statusFile,
		};
	}

	async writePull(query: PullQuery): Promise<PreparedRequestFiles> {
		await this.workDir.ensureInteropDirExists();

		const requestNonce = this.generateRequestNonce();
		const requestFile = this.workDir.getRequestFileRelative();
		const home = this.workDir.getRootAbsolute();
		const statusFile = this.workDir.getStatusFileAbsolute();
		const requestPayload = {
			schema_version: 1,
			request_nonce: requestNonce,
			command: "pull",
			created_at: new Date().toISOString(),
			home,
			status_file: statusFile,
			workspace: {
				status_file: statusFile,
			},
			args: {
				list: query.list,
				include_completed: query.includeCompleted === true,
			},
		};

		await this.writeAtomic(
			requestFile,
			JSON.stringify(requestPayload, null, 2),
		);

		logger.debug(
			`[Sync] [PtuneTaskRequestFileWriter] command=pull requestNonce=${requestNonce} requestFile=${requestFile}`,
		);

		return {
			requestNonce,
			requestFile: this.workDir.getRequestFileAbsolute(),
			statusFile,
		};
	}

	async writeReview(query: ReviewQuery): Promise<PreparedRequestFiles> {
		await this.workDir.ensureInteropDirExists();

		const requestNonce = this.generateRequestNonce();
		const requestFile = this.workDir.getRequestFileRelative();
		const home = this.workDir.getRootAbsolute();
		const statusFile = this.workDir.getStatusFileAbsolute();
		const requestPayload = {
			schema_version: 1,
			request_nonce: requestNonce,
			command: "review",
			created_at: new Date().toISOString(),
			home,
			status_file: statusFile,
			workspace: {
				status_file: statusFile,
			},
			args: {
				preset: query.preset ?? (query.date ? "date" : "today"),
				date: query.date ?? "",
				list: query.list,
			},
		};

		await this.writeAtomic(
			requestFile,
			JSON.stringify(requestPayload, null, 2),
		);

		logger.debug(
			`[Sync] [PtuneTaskRequestFileWriter] command=review requestNonce=${requestNonce} requestFile=${requestFile}`,
		);

		return {
			requestNonce,
			requestFile: this.workDir.getRequestFileAbsolute(),
			statusFile,
		};
	}

	writeDiff(
		query: PushQuery,
		payload: string,
	): Promise<PreparedTaskRequestFiles> {
		return this.writeTaskCommand("diff", query, payload);
	}

	writePush(
		query: PushQuery,
		payload: string,
	): Promise<PreparedTaskRequestFiles> {
		return this.writeTaskCommand("push", query, payload);
	}

	private async writeTaskCommand(
		command: "diff" | "push",
		query: PushQuery,
		payload: string,
	): Promise<PreparedTaskRequestFiles> {
		await this.workDir.ensureInteropDirExists();

		const requestNonce = this.generateRequestNonce();
		const requestFile = this.workDir.getRequestFileRelative();
		const home = this.workDir.getRootAbsolute();
		const statusFile = this.workDir.getStatusFileAbsolute();
		const inputFile = this.workDir.getInputFileRelative();
		const inputFileAbsolute = this.workDir.getInputFileAbsolute();

		await this.writeAtomic(inputFile, payload);

		const requestPayload = {
			schema_version: 1,
			request_nonce: requestNonce,
			command,
			created_at: new Date().toISOString(),
			home,
			status_file: statusFile,
			workspace: {
				status_file: statusFile,
			},
			input: {
				task_json_file: inputFileAbsolute,
			},
			args: {
				list: query.list,
				allow_delete: query.allowDelete === true,
			},
		};

		await this.writeAtomic(
			requestFile,
			JSON.stringify(requestPayload, null, 2),
		);

		logger.debug(
			`[Sync] [PtuneTaskRequestFileWriter] command=${command} requestNonce=${requestNonce} requestFile=${requestFile} inputFile=${inputFile}`,
		);

		return {
			requestNonce,
			requestFile: this.workDir.getRequestFileAbsolute(),
			statusFile,
			inputFile: inputFileAbsolute,
		};
	}

	private async writeAtomic(path: string, content: string): Promise<void> {
		const tmpPath = normalizePath(`${path}.tmp`);
		await this.app.vault.adapter.write(tmpPath, content);
		if (await this.app.vault.adapter.exists(path)) {
			await this.app.vault.adapter.remove(path);
		}
		await this.app.vault.adapter.rename(tmpPath, path);
	}

	private generateRequestNonce(): string {
		const iso = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.(\d{3})Z$/, "$1Z");
		const suffix = Math.random().toString(16).slice(2, 4).padEnd(2, "0");
		return `${iso}-${suffix}`;
	}
}
