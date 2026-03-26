export class PtuneTaskUriBuilder {
  buildAuthStatus(requestId: string, requestFile: string): string {
    return this.buildRunUri("auth/status", requestId, requestFile);
  }

  buildAuthLogin(requestId: string, requestFile: string): string {
    return this.buildRunUri("auth/login", requestId, requestFile);
  }

  buildPull(requestId: string, requestFile: string): string {
    return this.buildRunUri("pull", requestId, requestFile);
  }

  buildDiff(requestId: string, requestFile: string): string {
    return this.buildRunUri("diff", requestId, requestFile);
  }
  buildPush(requestId: string, requestFile: string): string {
    return this.buildRunUri("push", requestId, requestFile);
  }

  private buildRunUri(path: string, requestId: string, requestFile: string): string {
    const search = new URLSearchParams();
    search.set("request_id", requestId);
    search.set("request_file", requestFile);
    return `net.getperf.ptune.googleoauth:/run/${path}?${search.toString()}`;
  }
}

