const URLS = {
  auth: 'https://functions.poehali.dev/47298c23-bc8f-4dd4-93a4-014cb18cd9ca',
  teasers: 'https://functions.poehali.dev/695ff748-d1cf-4fd0-9a70-1c19f3b58418',
  sites: 'https://functions.poehali.dev/41ca0f1c-9ba7-4dde-8961-779ab034a1fc',
  payment: 'https://functions.poehali.dev/2f37ca7d-6e71-4e50-a5ad-6e3d30303a1c',
  stats: 'https://functions.poehali.dev/5ff833e6-2579-4cfa-bb41-275c81aa68be',
  pushSend: 'https://functions.poehali.dev/173ba231-42e9-401a-abd7-08cce3063f9d',
};

function getSession() {
  return localStorage.getItem('session_id') || '';
}

async function request(url: string, method = 'GET', body?: object) {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Session-Id': getSession(),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  register: (data: object) => request(URLS.auth, 'POST', { action: 'register', ...data }),
  login: (data: object) => request(URLS.auth, 'POST', { action: 'login', ...data }),
  me: () => request(URLS.auth, 'POST', { action: 'me' }),
  logout: () => request(URLS.auth, 'POST', { action: 'logout' }),

  getTeasers: () => request(URLS.teasers, 'POST', { action: 'list' }),
  createTeaser: (data: object) => request(URLS.teasers, 'POST', { action: 'create', ...data }),
  updateTeaserStatus: (id: number, status: string) => request(URLS.teasers, 'POST', { action: 'update', id, status }),

  getSites: () => request(URLS.sites, 'POST', { action: 'list' }),
  createSite: (data: object) => request(URLS.sites, 'POST', { action: 'create', ...data }),

  sendPush: (teaser_id: number) => request(URLS.pushSend, 'POST', { action: 'send', teaser_id }),
  getStats: () => request(URLS.stats, 'POST', { action: 'get' }),
  getTransactions: () => request(URLS.payment, 'POST', { action: 'list' }),
  createPayment: (amount: number) => request(URLS.payment, 'POST', { action: 'create', amount }),
};