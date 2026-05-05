export async function downloadCsv(url: string, filename: string) {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5614';
  const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

  const response = await fetch(`${baseUrl}${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await response.text();
  const blob = new Blob([text], { type: 'text/csv' });
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
