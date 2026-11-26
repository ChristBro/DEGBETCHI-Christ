import assert from 'node:assert/strict';
import { randomUUID, webcrypto } from 'node:crypto';
import { mkdtempSync, copyFileSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import { adminServer } from './server.mjs';

test('Choix de mesure, navigation et retrait dans le script public', () => {
  const source = readFileSync(new URL('../site.js', import.meta.url), 'utf8');
  const script = source.slice(source.indexOf('const localAnalytics ='));
  const storage = new Map();
  const calls = [];
  function open(pathname, hostname = '127.0.0.1') {
    const clicks = new Map();
    const element = () => ({ addEventListener() {}, setAttribute() {} });
    const buttons = ['accepted', 'refused'].map((value) => ({
      dataset: { choice: value },
      addEventListener(type, fn) { clicks.set(value, fn); },
    }));
    const banner = {
      ...element(),
      querySelector: element,
      querySelectorAll: () => buttons,
    };
    const context = {
      location: { pathname, hostname },
      document: { createElement: () => banner, body: { append() {} }, querySelector: () => null, querySelectorAll: () => [], addEventListener() {} },
      localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
      window: { addEventListener() {} },
      URLSearchParams,
      crypto: webcrypto,
      fetch: async (path, opts) => { calls.push([path, opts]); },
    };
    runInNewContext(script, context);
    return (choice) => clicks.get(choice)();
  }
  const choose = open('/apercu/index.html');
  assert.equal(calls.length, 0);
  choose('refused');
  const change = open('/apercu/agenda.html');
  assert.equal(calls.length, 0);
  change('accepted');
  change('accepted');
  assert.equal(calls.length, 1);
  const leave = open('/apercu/evenement.html');
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], '/analytics/view');
  assert.deepEqual([...calls[0][1].body.keys()], ['page', 'event_id']);
  assert.equal(calls[1][1].body.get('page'), 'evenement.html');
  assert.equal(calls[1][1].referrerPolicy, 'origin');
  open('/apercu/index.html', 'exemple.netlify.app')('accepted');
  assert.equal(calls.length, 2);
  leave('refused');
  open('/apercu/index.html');
  assert.equal(calls.length, 2);
});

test('Collecteur, consentement du formulaire, agrégats et limites', async (t) => {
  const dir = mkdtempSync(join(tmpdir(), 'neotisse-analytics-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const content = join(dir, 'content.js');
  copyFileSync(new URL('../content.js', import.meta.url), content);
  const server = adminServer(content);
  const host = '127.0.0.1:4181';
  const origin = 'http://' + host;
  function request(url, body, requestOrigin = origin, requestHost = host) {
    const input = Object.assign(Readable.from(body === undefined ? [] : [Buffer.from(body)]), {
      url, method: body === undefined ? 'GET' : 'POST', headers: { host: requestHost, origin: requestOrigin },
    });
    return new Promise((resolve) => {
      let status;
      let headers;
      server.emit('request', input, { writeHead(code, values) { status = code; headers = values; }, end(value) { resolve({ status, headers, text: String(value ?? '') }); } });
    });
  }
  const event = new URLSearchParams({ page: 'evenement.html', event_id: randomUUID() }).toString();
  assert.equal((await request('/apercu/contact.html')).headers['Referrer-Policy'], 'origin');
  assert.match((await request('/analytics')).text, /Aucune activité mesurée/);
  assert.match((await request('/analytics')).text, /Pages vues<\/dt><dd>0/);
  const demo = await request('/analytics?days=90&mode=demo');
  assert.match(demo.text, /Données fictives/);
  assert.match(demo.text, /<option value="90" selected>90 jours<\/option>/);
  assert.match(demo.text, /Pages vues<\/dt><dd>[1-9]/);
  assert.match((await request('/analytics')).text, /Pages vues<\/dt><dd>0/);
  assert.equal((await request('/analytics', undefined, origin, 'example.test')).status, 403);
  assert.equal((await request('/analytics/view', event, 'https://example.test')).status, 403);
  assert.equal((await request('/analytics/view', 'page=contact.html')).status, 400);
  assert.equal((await request('/analytics/view', event + '&email=test')).status, 400);
  assert.equal((await request('/analytics/view', 'x'.repeat(513))).status, 413);
  assert.equal((await request('/analytics/view', event)).status, 204);
  for (const [name, page, value] of [['hero', 'index.html', 'ateliers'], ['workshop', 'services.html', 'filage-au-fuseau'],
    ['duration', 'services.html', '75'], ['page_view', 'services.html', 'index.html|services.html']]) {
    const measurement = new URLSearchParams({ name, page, value, event_id: randomUUID() });
    assert.equal((await request('/analytics/view', measurement.toString())).status, 204);
  }
  assert.equal((await request('/analytics/view', event)).status, 204);
  const contact = new URLSearchParams({ firstName: 'Test', lastName: 'Recette', email: 'test@example.test', subject: 'Essai fictif', body: 'Test de recette' });
  assert.equal((await request('/messages/envoyer', contact.toString())).status, 201);
  assert.equal((await request('/messages/envoyer', 'analytics=1')).status, 400);
  contact.set('analytics', '1');
  assert.equal((await request('/messages/envoyer', contact.toString())).status, 201);
  const filtered = await request('/analytics?days=30');
  assert.match(filtered.text, /<option value="30" selected>1 mois<\/option>/);
  assert.match(filtered.text, /Pages vues<\/dt><dd>2/);
  assert.match(filtered.text, /Fiches agenda consultées<\/dt><dd>1/);
  assert.match(filtered.text, /Messages reçus<\/dt><dd>1/);
  assert.match(filtered.text, /Accueil → Services/);
  assert.match(filtered.text, /1 min 15 s/);
  assert.match(filtered.text, /Découvrir les ateliers<\/span><strong>1 · 100 %/);
  assert.match(filtered.text, /Ateliers les plus vus/);
  assert.doesNotMatch(readFileSync(join(dir, '.neotisse-analytics.local.json'), 'utf8'), /@|Essai fictif/);
  for (let index = 0; index < 111; index++) assert.equal((await request('/analytics/view', event)).status, 204);
  assert.equal((await request('/analytics/view', event)).status, 429);
  const historical = new Date(Date.now() - 100 * 86_400_000).toISOString().slice(0, 10);
  const storage = join(dir, '.neotisse-analytics.local.json');
  const data = JSON.parse(readFileSync(storage, 'utf8'));
  data[historical] = { pages: { 'index.html': 4 }, messages: 0 };
  writeFileSync(storage, JSON.stringify(data));
  for (const [days, label] of [[1, '1 jour'], [7, '1 semaine'], [30, '1 mois'], [365, '1 an']]) {
    const report = await request('/analytics?days=' + days);
    assert.ok(report.text.includes('<option value="' + days + '" selected>' + label));
    assert.ok(report.text.includes('Pages vues</dt><dd>' + (days === 365 ? 6 : 2) + '</dd>'));
    assert.ok(report.text.includes(days === 365 ? 'Pages vues par mois' : 'Pages vues par jour'));
  }
  const confirmation = await request('/analytics/reset');
  const token = confirmation.text.match(/name="token" value="([^"]+)"/)[1];
  assert.match((await request('/analytics')).text, /<progress[^>]+max="1" value="1"/);
  assert.equal((await request('/analytics/reset', 'token=invalide')).status, 403);
  assert.match((await request('/analytics')).text, /Pages vues<\/dt><dd>2/);
  assert.equal((await request('/analytics/reset', 'token=' + token)).status, 303);
  assert.match((await request('/analytics?reset=1')).text, /Pages vues<\/dt><dd>0/);
  assert.match((await request('/')).text, /Essai fictif/);
  writeFileSync(join(dir, '.neotisse-analytics.local.json'), '{');
  const unavailable = await request('/analytics');
  assert.equal(unavailable.status, 503);
  assert.match(unavailable.text, /temporairement indisponibles/);
  assert.doesNotMatch(unavailable.text, /Aucune activité mesurée/);
});
