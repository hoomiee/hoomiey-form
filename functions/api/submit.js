const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: jsonHeaders
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: jsonHeaders
  });
}

export async function onRequestPost(context) {
  let payload;

  try {
    payload = await context.request.json();
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
  }

  const receivedAt = new Date().toISOString();
  const normalized = {
    receivedAt,
    source: 'hoomiey-form',
    payload
  };

  const forwardUrl = context.env?.FORWARD_WEBHOOK_URL;
  if (forwardUrl) {
    try {
      const upstream = await fetch(forwardUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalized)
      });

      if (!upstream.ok) {
        return jsonResponse(
          { ok: false, error: `Forward webhook failed with HTTP ${upstream.status}` },
          502
        );
      }
    } catch (error) {
      return jsonResponse(
        { ok: false, error: error instanceof Error ? error.message : 'Forward webhook failed' },
        502
      );
    }
  }

  return jsonResponse({ ok: true, receivedAt, forwarded: Boolean(forwardUrl) });
}