// src/infrastructure/sync/ptune-sync/PtuneSyncError.ts

export class PtuneSyncKnownError extends Error {
  constructor(
    public readonly type: string,
    message: string,
  ) {
    super(message);
  }
}

export class PtuneSyncContractError extends Error {
  constructor(message: string) {
    super(message);
  }
}
