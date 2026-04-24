async function req(method, path, body, isForm = false) {
  const opts = { method, credentials: 'include' };
  if (body && !isForm) {
    opts.headers = { 'Content-Type': 'application/json' };
    opts.body = JSON.stringify(body);
  } else if (body && isForm) {
    opts.body = body;
  }
  const res = await fetch('/api' + path, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Er ging iets mis' }));
    throw new Error(err.error || 'Er ging iets mis');
  }
  return res.json();
}

export const api = {
  me: () => req('GET', '/me'),
  login: (username, password) => req('POST', '/login', { username, password }),
  logout: () => req('POST', '/logout'),

  trainings: {
    list: (weekStart) => req('GET', `/trainings${weekStart ? `?weekStart=${weekStart}` : ''}`),
    next: () => req('GET', '/trainings/next'),
    create: (data) => req('POST', '/trainings', data),
    update: (id, data) => req('PUT', `/trainings/${id}`, data),
    remove: (id) => req('DELETE', `/trainings/${id}`),
    getLog: (id) => req('GET', `/trainings/${id}/log`),
    saveLog: (id, data) => req('POST', `/trainings/${id}/log`, data),
    uploadSelfie: (id, file) => {
      const fd = new FormData();
      fd.append('selfie', file);
      return req('POST', `/trainings/${id}/selfie`, fd, true);
    },
  },

  messages: {
    list: (since) => req('GET', `/messages${since != null ? `?since=${since}` : ''}`),
    send: (body) => req('POST', '/messages', { body }),
  },

  stats: () => req('GET', '/stats'),
  weekSummary: () => req('GET', '/week-summary'),
};
