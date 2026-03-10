import { Plugin } from "obsidian";

import { config } from "./config/config";
import { logger } from "./shared/logger/loggerInstance";

export default class PtunePlugin extends Plugin {
	async onload() {
		await config.load(this);

		logger.initializeVault(this.app.vault);

		logger.configure(
			config.settings.logLevel,
			config.settings.enableLogFile,
		);

		logger.debug("ptune-task loaded");
	}
}
