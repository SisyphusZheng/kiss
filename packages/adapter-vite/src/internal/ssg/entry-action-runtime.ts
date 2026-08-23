/** Emit the shared ADR-0120/ADR-0121 action protocol exactly once per entry. */
export function renderActionRuntime(): string {
  return `async function __runActionProtocol(c, routeModule, loadContext, renderHtmlError, state) {
  const url = new URL(c.req.url);
  const actionName = (() => {
    for (const key of url.searchParams.keys()) if (key.startsWith('/')) return key.slice(1);
    return undefined;
  })();
  const namedActions = typeof routeModule.actions === 'object' && routeModule.actions !== null
    ? routeModule.actions
    : {};
  const actionFn = actionName !== undefined
    ? (Object.prototype.hasOwnProperty.call(namedActions, actionName) ? namedActions[actionName] : undefined)
    : (typeof routeModule.action === 'function' ? routeModule.action : undefined);
  state.isFetch = c.req.header(__actionFetchHeader) === 'true';

  const csrfOff = loadContext.env && loadContext.env.OPEN_ELEMENT_DISABLE_CSRF === '1';
  if (!csrfOff) {
    const origin = c.req.header('origin');
    const fetchSite = (c.req.header('sec-fetch-site') || '').toLowerCase();
    let crossSite = fetchSite === 'cross-site';
    if (!crossSite && origin && origin !== 'null') {
      try {
        const source = new URL(origin);
        const target = new URL(c.req.url);
        const loopback = (host) => host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
        crossSite = source.origin !== target.origin && !(
          source.protocol === 'http:' && target.protocol === 'http:' &&
          loopback(source.hostname) && loopback(target.hostname)
        );
      } catch {
        crossSite = true;
      }
    } else if (!crossSite && fetchSite === 'same-site') {
      crossSite = true;
    }
    if (crossSite) {
      const response = state.isFetch
        ? c.json({ type: 'about:blank', title: 'Forbidden', status: 403, detail: 'Cross-site form submission rejected' }, 403, { 'Content-Type': __problemJsonMediaType })
        : c.text('Forbidden', 403);
      return { response };
    }
  }

  if (typeof actionFn !== 'function') {
    const message = actionName !== undefined
      ? 'No action named "' + actionName + '" on this route.'
      : 'This route does not accept submissions.';
    const response = state.isFetch
      ? c.json({ type: 'about:blank', title: 'Not Found', status: 404, detail: message }, 404, { 'Content-Type': __problemJsonMediaType })
      : renderHtmlError('404 Not Found', message, 404);
    return { response };
  }

  let formData;
  try {
    formData = await c.req.raw.formData();
  } catch {
    const message = 'Could not parse the form body.';
    const response = state.isFetch
      ? c.json({ type: 'about:blank', title: 'Bad Request', status: 400, detail: message }, 400, { 'Content-Type': __problemJsonMediaType })
      : renderHtmlError('400 Bad Request', message, 400);
    return { response };
  }

  const actionResult = await actionFn({ ...loadContext, formData });
  if (actionResult instanceof Response) {
    throw new Error('[openElement] Actions must not return a Response object; return data, fail(status, data), or throw redirect() (ADR-0121).');
  }
  const prgParams = new URLSearchParams(url.search);
  for (const key of [...prgParams.keys()]) if (key.startsWith('/')) prgParams.delete(key);
  const search = prgParams.toString();
  const prgTarget = url.pathname + (search ? '?' + search : '');

  if (state.isFetch) {
    if (__isActionFailure(actionResult)) {
      let data = actionResult.data;
      try { JSON.stringify(data); } catch { data = null; }
      return { response: c.json({ type: 'failure', status: actionResult.status, data }, actionResult.status) };
    }
    return { response: c.json({ type: 'redirect', status: 303, location: prgTarget }) };
  }
  if (!__isActionFailure(actionResult)) {
    return { response: c.redirect(prgTarget, 303) };
  }
  return { actionResult };
}`;
}
