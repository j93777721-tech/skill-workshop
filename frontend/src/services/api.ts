const API = '/api';

export async function streamRequest(
  url: string,
  body: Record<string, any>,
  onChunk: (text: string) => void,
  onDone: (full: string) => void,
  onError: (msg: string) => void,
): Promise<void> {
  try {
    const res = await fetch(`${API}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      onError(err.error || 'Request failed');
      return;
    }

    if (!res.body) {
      onError('No response body');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.type === 'chunk') {
            fullContent += evt.content;
            onChunk(evt.content);
          } else if (evt.type === 'done') {
            onDone(evt.fullContent || fullContent);
          } else if (evt.type === 'error') {
            onError(evt.message);
          }
        } catch {
          // ignore malformed SSE lines
        }
      }
    }

    // If stream ended without a "done" event, call onDone with accumulated content
    if (fullContent && !buffer.includes('"type":"done"')) {
      onDone(fullContent);
    }
  } catch (err: any) {
    console.error('[streamRequest error]', err);
    onError(err.message || '网络请求失败');
  }
}

export async function postJSON(url: string, body: Record<string, any>): Promise<any> {
  const res = await fetch(`${API}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}
