// src/infrastructure/vscode/VSCodeConfigService.ts

import * as vscode from "vscode";

export interface HabitTasks {
  morning: string[];
  evening: string[];
}

export class VSCodeConfigService {
  private readonly section = "ptune";

  getHabitTasks(): HabitTasks {
    const config = vscode.workspace.getConfiguration(this.section);

    const value = config.get<any>("daily.habitTasks");

    if (!value) {
      return { morning: [], evening: [] };
    }

    // backward compatibility
    if (Array.isArray(value)) {
      return {
        morning: value,
        evening: [],
      };
    }

    return {
      morning: Array.isArray(value.morning) ? value.morning : [],
      evening: Array.isArray(value.evening) ? value.evening : [],
    };
  }
}
