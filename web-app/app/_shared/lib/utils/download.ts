export async function downloadCsv(url: string, filename: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5614';
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  const response = await fetch(`${baseUrl}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

export async function downloadPdf(url: string, filename: string, params?: Record<string, string>) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5614';
  const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  const response = await fetch(`${baseUrl}${url}${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
