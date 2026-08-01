import assert from 'node:assert/strict';

import { onRequest } from '../functions/api/waitlist.js';

const clientId = '44bda778-bdfb-4d34-98b1-45ba43e70aed';

class MockDatabase {
  constructor() {
    this.rows = new Map();
  }

  prepare(query) {
    return {
      bind: (...values) => ({
        run: async () => {
          if (query.startsWith('INSERT')) {
            const [hash, ...utm] = values;
            if (this.rows.has(hash)) return { meta: { changes: 0 } };
            this.rows.set(hash, utm);
            return { meta: { changes: 1 } };
          }

          if (query.startsWith('DELETE')) {
            return { meta: { changes: this.rows.delete(values[0]) ? 1 : 0 } };
          }

          throw new Error(`Unexpected query: ${query}`);
        },
      }),
    };
  }
}

const request = (method, body, headers = {}) =>
  new Request('https://pop-reminder.pages.dev/api/waitlist', {
    method,
    headers: {
      'content-type': 'application/json',
      origin: 'https://pop-reminder.pages.dev',
      ...headers,
    },
    body: method === 'GET' ? undefined : JSON.stringify(body),
  });

const call = async (method, body, env = { WAITLIST_DB: new MockDatabase() }, headers) => {
  const response = await onRequest({ request: request(method, body, headers), env });
  return { response, body: await response.json() };
};

{
  const database = new MockDatabase();
  const payload = {
    clientId,
    utmSource: ' x\u0000 '.replace('\\u0000', '\u0000'),
    utmMedium: 'social',
    utmCampaign: 'launch'.repeat(30),
    utmContent: '',
    website: '',
  };

  const first = await call('POST', payload, { WAITLIST_DB: database });
  assert.equal(first.response.status, 200);
  assert.deepEqual(first.body, { ok: true, status: 'joined' });
  assert.equal(database.rows.size, 1);

  const [[storedHash, storedUtm]] = database.rows;
  assert.match(storedHash, /^[0-9a-f]{64}$/);
  assert.notEqual(storedHash, clientId);
  assert.deepEqual(storedUtm.slice(0, 2), ['x', 'social']);
  assert.equal(storedUtm[2].length, 80);
  assert.equal(storedUtm[3], null);

  const duplicate = await call('POST', payload, { WAITLIST_DB: database });
  assert.deepEqual(duplicate.body, { ok: true, status: 'already_joined' });
  assert.equal(database.rows.size, 1);

  const removed = await call('DELETE', { clientId }, { WAITLIST_DB: database });
  assert.deepEqual(removed.body, { ok: true, status: 'removed' });
  assert.equal(database.rows.size, 0);

  const removedAgain = await call('DELETE', { clientId }, { WAITLIST_DB: database });
  assert.deepEqual(removedAgain.body, { ok: true, status: 'not_found' });
}

{
  const database = new MockDatabase();
  const bot = await call(
    'POST',
    { clientId, website: 'https://spam.example' },
    { WAITLIST_DB: database },
  );
  assert.deepEqual(bot.body, { ok: true, status: 'joined' });
  assert.equal(database.rows.size, 0);
}

{
  const invalid = await call('POST', { clientId: 'not-a-uuid' });
  assert.equal(invalid.response.status, 400);
  assert.equal(invalid.body.error, 'invalid_client_id');

  const wrongOrigin = await call(
    'POST',
    { clientId },
    { WAITLIST_DB: new MockDatabase() },
    { origin: 'https://example.com' },
  );
  assert.equal(wrongOrigin.response.status, 403);

  const wrongType = await call(
    'POST',
    { clientId },
    { WAITLIST_DB: new MockDatabase() },
    { 'content-type': 'text/plain' },
  );
  assert.equal(wrongType.response.status, 415);

  const unavailable = await call('POST', { clientId }, {});
  assert.equal(unavailable.response.status, 503);

  const get = await call('GET', null);
  assert.equal(get.response.status, 405);
  assert.equal(get.response.headers.get('allow'), 'POST, DELETE');
}

console.log('Waitlist API checks passed.');
