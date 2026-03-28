export class PtuneTaskUriBuilder {
  buildAuthStatus(requestFile: string): string {
    return this.buildRunUri("auth/status", requestFile);
  }

  buildAuthLogin(requestFile: string): string {
    return this.buildRunUri("auth/login", requestFile);
  }

  buildPull(requestFile: string): string {
    return this.buildRunUri("pull", requestFile);
  }

  buildReview(requestFile: string): string {
    return this.buildRunUri("review", requestFile);
  }

  buildDiff(requestFile: string): string {
    return this.buildRunUri("diff", requestFile);
  }

  buildPush(requestFile: string): string {
    return this.buildRunUri("push", requestFile);
  }

  private buildRunUri(path: string, requestFile: string): string {
    const search = new URLSearchParams();
    search.set("request_file", requestFile);
    return `net.getperf.ptune.googleoauth:/run/${path}?${search.toString()}`;
  }
}
