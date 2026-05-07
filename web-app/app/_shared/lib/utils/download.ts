function getDownloadUrl(path: string, queryString = '') {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5614').replace(/\/+$/, '');
  return `${baseUrl}${path}${queryString}`;
}

function getAuthHeaders(): HeadersInit {
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function triggerDownload(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadCsv(url: string, filename: string) {
  const response = await fetch(getDownloadUrl(url), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  triggerDownload(await response.blob(), filename);
}

export async function downloadPdf(url: string, filename: string, params?: Record<string, string>) {
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const response = await fetch(getDownloadUrl(url, queryString), { headers: getAuthHeaders() });
  if (!response.ok) throw new Error(`Download failed: ${response.status}`);
  triggerDownload(await response.blob(), filename);
}
