// src/infrastructure/sync/ptune-sync/CliEnvelope.ts

export type CliEnvelope<T> = {
  version: number;
  success: boolean;
  command: string;
  data?: T;
  meta?: unknown;
  error?: {
    type: string;
    message: string;
  };
};
