import { PtuneSyncClient } from "../shared/PtuneSyncClient";
import { PtuneSyncCommandResultMapper } from "./PtuneSyncCommandResultMapper";

type AuthData = {
  auth: {
    authenticated: boolean;
    email?: string | null;
    expires_at?: string;
  };
};

export class PtuneSyncUriAuthService {
  constructor(private readonly client: PtuneSyncClient) {}

  async status(): Promise<{ authenticated: boolean; email?: string | null }> {
    const result = PtuneSyncCommandResultMapper.fromDto(
      await this.client.authStatus<AuthData>(),
    );

    if (!result.data?.auth) {
      throw new Error("Invalid auth status response");
    }

    return {
      authenticated: result.data.auth.authenticated,
      email: result.data.auth.email,
    };
  }

  async login(): Promise<void> {
    const result = PtuneSyncCommandResultMapper.fromDto(
      await this.client.authLogin<AuthData>(),
    );

    if (!result.data?.auth?.authenticated) {
      throw new Error(
        result.errorMessage ?? "Login did not complete successfully",
      );
    }
  }
}
