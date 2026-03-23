export class PtuneTaskUriBuilder {
  buildAuthStatus(requestId: string, requestFile: string): string {
    const search = new URLSearchParams();
    search.set("request_id", requestId);
    search.set("request_file", requestFile);
    return `net.getperf.ptune.googleoauth:/run/auth/status?${search.toString()}`;
  }
}
