const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Request failed" }));

    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  health: () => request("/health"),
  lookups: () => request("/lookups"),
  dashboard: (query = "") => request(`/dashboard${query}`),
  crimeTrends: (query = "") => request(`/crime-trends${query}`),
  hotspots: (query = "") => request(`/hotspots${query}`),
  repeatOffenders: (query = "") =>
    request(`/repeat-offenders${query}`),
  network: (query = "") => request(`/network${query}`),
  predictive: (query = "") => request(`/predictive${query}`),
  districts: () => request("/districts"),
  districtAnalytics: districtId =>
    request(`/district-analytics/${districtId}`),
  reports: (query = "") => request(`/reports${query}`),
  alerts: () => request("/alerts"),
  resources: () => request("/resources"),
  search: q =>
    request(`/search?q=${encodeURIComponent(q)}`),
  assistant: question =>
    request("/assistant", {
      method: "POST",
      body: JSON.stringify({ question })
    })
};