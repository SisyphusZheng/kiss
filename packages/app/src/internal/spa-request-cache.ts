/** Caches the reusable GET request that represents the current SPA route. */
export class SpaRequestCache {
  #url = '';
  #request: Request | undefined;

  get(url: string, init: RequestInit = {}): Request {
    const method = (init.method ?? 'GET').toUpperCase();
    const reusable = method === 'GET' && init.body == null;
    if (reusable && this.#request && this.#url === url) return this.#request;

    const request = new Request(url, init);
    if (reusable) {
      this.#url = url;
      this.#request = request;
    } else {
      this.clear();
    }
    return request;
  }

  clear(): void {
    this.#url = '';
    this.#request = undefined;
  }
}
