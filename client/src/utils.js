export function getToken() {
  const user = JSON.parse(localStorage.getItem('user'));
  return user && user.token ? user.token : null;
}

export async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = options.headers || {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  // Always use relative URL so proxy works
  return fetch(url, { ...options, headers });
} 