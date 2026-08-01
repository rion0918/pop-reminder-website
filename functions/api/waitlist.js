const MAX_BODY_LENGTH = 4096;
const MAX_UTM_LENGTH = 80;
const CLIENT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...responseHeaders, ...headers },
  });

const cleanUtm = (value) => {
  if (typeof value !== 'string') return null;
  const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_UTM_LENGTH);
  return cleaned || null;
};

const hashClientId = async (clientId) => {
  const bytes = new TextEncoder().encode(clientId);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const readBody = async (request) => {
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) {
    return { error: json({ ok: false, error: 'unsupported_media_type' }, 415) };
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_BODY_LENGTH) {
    return { error: json({ ok: false, error: 'request_too_large' }, 413) };
  }

  const source = await request.text();
  if (source.length > MAX_BODY_LENGTH) {
    return { error: json({ ok: false, error: 'request_too_large' }, 413) };
  }

  try {
    return { body: JSON.parse(source) };
  } catch {
    return { error: json({ ok: false, error: 'invalid_json' }, 400) };
  }
};

const checkOrigin = (request) => {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
};

const validateClientId = (body) =>
  typeof body?.clientId === 'string' && CLIENT_ID_PATTERN.test(body.clientId);

const addSignup = async (request, env) => {
  if (!env.WAITLIST_DB) return json({ ok: false, error: 'service_unavailable' }, 503);
  if (!checkOrigin(request)) return json({ ok: false, error: 'forbidden_origin' }, 403);

  const { body, error } = await readBody(request);
  if (error) return error;
  if (!validateClientId(body)) return json({ ok: false, error: 'invalid_client_id' }, 400);

  // Silently accept automated form fills without recording them.
  if (typeof body.website === 'string' && body.website.trim()) {
    return json({ ok: true, status: 'joined' });
  }

  const clientIdHash = await hashClientId(body.clientId);
  const result = await env.WAITLIST_DB.prepare(
    `INSERT OR IGNORE INTO waitlist_signups
      (client_id_hash, utm_source, utm_medium, utm_campaign, utm_content)
      VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      clientIdHash,
      cleanUtm(body.utmSource),
      cleanUtm(body.utmMedium),
      cleanUtm(body.utmCampaign),
      cleanUtm(body.utmContent),
    )
    .run();

  return json({
    ok: true,
    status: result.meta?.changes === 1 ? 'joined' : 'already_joined',
  });
};

const removeSignup = async (request, env) => {
  if (!env.WAITLIST_DB) return json({ ok: false, error: 'service_unavailable' }, 503);
  if (!checkOrigin(request)) return json({ ok: false, error: 'forbidden_origin' }, 403);

  const { body, error } = await readBody(request);
  if (error) return error;
  if (!validateClientId(body)) return json({ ok: false, error: 'invalid_client_id' }, 400);

  const clientIdHash = await hashClientId(body.clientId);
  const result = await env.WAITLIST_DB.prepare(
    'DELETE FROM waitlist_signups WHERE client_id_hash = ?',
  )
    .bind(clientIdHash)
    .run();

  return json({
    ok: true,
    status: result.meta?.changes === 1 ? 'removed' : 'not_found',
  });
};

export const onRequest = async ({ request, env }) => {
  if (request.method === 'POST') return addSignup(request, env);
  if (request.method === 'DELETE') return removeSignup(request, env);

  return json(
    { ok: false, error: 'method_not_allowed' },
    405,
    { Allow: 'POST, DELETE' },
  );
};
