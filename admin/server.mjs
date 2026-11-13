import { createServer } from 'node:http';
import { randomBytes, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const prefix = 'window.neotisseContent = ';
const groups = {
  events: {
    label: 'Rendez-vous',
    singular: 'un événement',
    fields: [
      ['title', 'Titre', 'text', 160, true],
      ['date', 'Date', 'date', 10, true],
      ['time', 'Horaire', 'text', 80],
      ['place', 'Lieu', 'text', 160],
      ['description', 'Description', 'textarea', 2000, true],
      ['url', 'Lien vers les détails', 'url', 600],
    ],
  },
  services: {
    label: 'Prestations', singular: 'une prestation',
    fields: [['title', 'Titre', 'text', 160, true], ['slug', 'Identifiant unique (ex. atelier-filage)', 'text', 100, true], ['description', 'Description', 'textarea', 2000, true], ['image', 'Photo dans assets (facultatif)', 'text', 100]],
  },
  partners: {
    label: 'Partenaires', singular: 'un partenaire',
    fields: [['name', 'Nom', 'text', 160, true], ['image', 'Fichier du logo dans assets/partenaires (facultatif)', 'text', 100]],
  },
  reviews: {
    label: 'Livre d’or',
    singular: 'un avis',
    fields: [
      ['name', 'Prénom ou signature', 'text', 120, true],
      ['activity', 'Atelier', 'text', 160],
      ['quote', 'Avis', 'textarea', 2000, true],
    ],
  },

};
const defaults = JSON.parse(readFileSync(new URL('./defaults.json', import.meta.url), 'utf8'));

const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const revision = (source) => createHash('sha256').update(source).digest('hex');

function fieldsFor(group, record = {}) {
  const { fields, singular, fixed } = groups[group];
  const fieldsHtml = fields.map(([key, label, type, limit, required]) => {
    const value = escape(record[key]);
    const attrs = 'name="' + group + '.' + key + '" maxlength="' + limit + '"' + (required ? ' required' : '');
    const input = type === 'textarea'
      ? '<textarea rows="3" ' + attrs + '>' + value + '</textarea>'
      : '<input type="' + type + '" ' + attrs + ' value="' + value + '">';
    return '<label>' + label + input + '</label>';
  }).join('');
  return '<fieldset><legend>' + escape(record.title || record.name || 'Ajouter ' + singular) + '</legend>' + fieldsHtml
    + (['events', 'reviews'].includes(group) ? '<label>Statut<select name="' + group + '.demo"><option value="yes">Fictif · démonstration</option>'
      + '<option value="no"' + (record.demo === false ? ' selected' : '') + '>Réel</option></select></label>' : '')
    + (fixed ? '' : '<button class="remove" type="button">Retirer</button>') + '</fieldset>';
}

function render(data, token, version, message, messages) {
  const sections = Object.entries(groups).map(([group, { label, singular, fixed }]) =>
    '<section id="' + group + '"><h2>' + label + '</h2><div class="records">' + data[group].map((row) => fieldsFor(group, row)).join('')
    + '</div>' + (fixed ? '' : '<button type="button" class="add">Ajouter ' + singular + '</button><template>' + fieldsFor(group) + '</template>') + '</section>').join('');
  const menu = [['events', 'Rendez-vous'], ['services', 'Prestations'], ['partners', 'Partenaires'],
    ['reviews', 'Livre d’or'], ['messages', 'Messages reçus']];
  const links = menu.map(([id, label]) => '<a href="#' + id + '">' + label + '</a>').join('');
  const inbox = messages.map((item) => '<article><h3>' + escape(item.subject) + '</h3><p>' + escape(item.email)
    + ' · ' + escape(new Date(item.date).toLocaleString('fr-FR')) + '</p><p class="message-body">' + escape(item.body) + '</p>'
    + '<form method="post" action="/messages/retirer"><input type="hidden" name="token" value="' + token
    + '"><input type="hidden" name="id" value="' + escape(item.id) + '"><button class="remove">Retirer le message</button></form></article>').join('');
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Administration · Néotisse</title><link rel="stylesheet" href="/admin.css"><script src="/admin.js" defer></script></head>
  <body><header><div><p>NÉOTISSE / ADMINISTRATION LOCALE</p><h1>Contenus du site</h1><p>Gérez les rendez-vous et les avis affichés sur le site.</p></div>
  <nav aria-label="Sections">${links}</nav></header>
  <main><p>Après avoir enregistré, ouvrez <a href="/apercu/index.html#livre-or" target="_blank" rel="noopener">le livre d’or sur le site local ↗</a>. Pour mettre à jour la version en ligne, partagez le fichier de contenu sur GitHub et redéployez le site.</p><p class="feedback" role="status">${escape(message)}</p>
  <form id="content-editor" method="post" action="/"><input type="hidden" name="token" value="${token}"><input type="hidden" name="revision" value="${version}">
  ${sections}<div class="save"><span>Les modifications sont enregistrées dans le projet local.</span><button type="submit">Enregistrer</button></div></form><section id="messages"><h2>Messages reçus</h2><p>Messages envoyés depuis le formulaire de l’aperçu local.</p>${inbox || "<p>Aucun message pour le moment.</p>"}</section></main></body></html>`;
}

function readRecords(form, group, current) {
  const { fields, label, fixed } = groups[group];
  const count = form.getAll(group + '.' + fields[0][0]).length;
  if ((fixed && count !== current.length) || count > 100 || fields.some(([key]) => form.getAll(group + '.' + key).length !== count)) {
    throw new Error(label + ' : données incomplètes ou trop de fiches.');
  }
  const values = fields.map(([key]) => form.getAll(group + '.' + key));
  return Array.from({ length: count }, (_, row) => {
    const record = fixed ? { ...current[row] } : {};
    fields.forEach(([key, fieldLabel, type, limit, required], col) => {
      const value = values[col][row].trim();
      if (value.length > limit || (required && !value)) throw new Error(label + ' : vérifiez le champ « ' + fieldLabel + ' ».');
      if (type === 'date') {
        const date = new Date(value + 'T12:00:00Z');
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
          throw new Error('La date de l’événement est invalide.');
        }
      }
      if (type === 'url' && value && !['http:', 'https:'].includes(URL.parse(value)?.protocol)) {
        throw new Error('Le lien doit être une adresse HTTP ou HTTPS.');
      }
      if (type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('Adresse e-mail invalide.');
      if (key === 'slug' && !/^[a-z][a-z0-9-]*$/.test(value)) throw new Error('Identifiant invalide : lettres minuscules, chiffres et tirets uniquement.');
      if (key === 'image' && value && !/^[a-z0-9-]+\.(?:jpg|png|webp)$/.test(value)) throw new Error('Nom du fichier logo invalide.');
      record[key] = value;
    });
    if (['events', 'reviews'].includes(group)) record.demo = form.getAll(group + '.demo')[row] !== 'no';
    return record;
  });
}

export function adminServer(contentPath) {
  const token = randomBytes(24).toString('hex');
  const inboxPath = join(dirname(contentPath), '.neotisse-messages.local.json');
  function inbox() {
    try { return JSON.parse(readFileSync(inboxPath, 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  }
  function saveInbox(messages) {
    writeFileSync(inboxPath + '.tmp', JSON.stringify(messages, null, 2), { mode: 0o600 });
    renameSync(inboxPath + '.tmp', inboxPath);
  }
  return createServer(async (req, res) => {
    const send = (code, type, body, preview = false) => {
      res.writeHead(code, { 'Content-Type': type + '; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': preview
          ? "default-src 'self'; style-src 'self' 'unsafe-inline'; form-action 'self' mailto:; frame-ancestors 'none'"
          : "default-src 'none'; script-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'" });
      res.end(body);
    };
    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host ?? '')) return send(403, 'text/plain', 'Accès local uniquement.');
    if (req.method === 'GET' && ['/admin.css', '/admin.js'].includes(req.url)) {
      return send(200, req.url.endsWith('.css') ? 'text/css' : 'application/javascript', readFileSync(new URL('.' + req.url, import.meta.url)));
    }
    if (req.method === 'GET' && req.url.startsWith('/apercu/')) {
      const file = req.url.slice('/apercu/'.length).split('?')[0];
      const types = {
        html: 'text/html', css: 'text/css', js: 'application/javascript',
        jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp',
      };
      const allowed = /^(?:index|a-propos|nos-actions|agenda|services|contact)\.html$|^(?:styles|neotisse|page-motion)\.css$|^(?:site|content)\.js$|^assets\/(?:partenaires\/)?[a-z0-9-]+\.(?:jpg|png|webp)$/;
      if (!allowed.test(file)) return send(404, 'text/plain', 'Page introuvable.');
      try {
        const path = file === 'content.js' ? contentPath : new URL('../' + file, import.meta.url);
        return send(200, types[file.split('.').at(-1)], readFileSync(path), true);
      } catch {
        return send(404, 'text/plain', 'Page introuvable.');
      }
    }
    if (!['/', '/?saved=1', '/messages/envoyer', '/messages/retirer'].includes(req.url)) return send(404, 'text/plain', 'Page introuvable.');
    try {
      if (req.method === 'GET') {
        const source = readFileSync(contentPath, 'utf8');
        const data = { ...defaults, ...JSON.parse(source.trim().slice(prefix.length, -1)) };
        return send(200, 'text/html', render(data, token, revision(source), req.url.includes('?') ? 'Modifications enregistrées.' : '', inbox()));
      }
      if (req.method !== 'POST' || req.headers.origin !== 'http://' + req.headers.host) {
        return send(403, 'text/plain', 'Enregistrement refusé.');
      }
      let body = '';
      for await (const chunk of req.setEncoding('utf8')) {
        body += chunk;
        if (body.length > 500_000) return send(413, 'text/plain', 'Formulaire trop volumineux.');
      }
      const form = new URLSearchParams(body);
      if (req.url === '/messages/envoyer') {
        const email = form.get('email')?.trim();
        const subject = form.get('subject')?.trim();
        const message = form.get('body')?.trim();
        if (!email || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
          || !subject || subject.length > 160 || !message || message.length > 4000) {
          return send(400, 'text/plain', 'Vérifiez votre e-mail, le motif et le message.');
        }
        saveInbox([{ id: randomBytes(12).toString('hex'), date: new Date().toISOString(), email, subject, body: message }, ...inbox()]);
        return send(201, 'text/plain', 'Message reçu.');
      }
      if (form.get('token') !== token) return send(403, 'text/plain', 'Rechargez le back-office avant d’enregistrer.');
      if (req.url === '/messages/retirer') {
        saveInbox(inbox().filter((item) => item.id !== form.get('id')));
        res.writeHead(303, { Location: '/#messages' });
        return res.end();
      }
      const source = readFileSync(contentPath, 'utf8');
      if (form.get('revision') !== revision(source)) {
        return send(409, 'text/plain', 'Le contenu a changé depuis l’ouverture du formulaire. Revenez en arrière pour copier vos modifications, puis rechargez la page.');
      }
      let data;
      try {
        const current = { ...defaults, ...JSON.parse(source.trim().slice(prefix.length, -1)) };
        data = { ...current, ...Object.fromEntries(Object.keys(groups).map((key) => [key, readRecords(form, key, current[key])])) };
        if (new Set(data.services.map((service) => service.slug)).size !== data.services.length) throw new Error('Chaque prestation doit avoir un identifiant unique.');
      } catch (error) {
        return send(400, 'text/plain', error.message + ' Revenez au formulaire pour corriger la saisie.');
      }
      const temporary = contentPath + '.tmp';
      writeFileSync(temporary, prefix + JSON.stringify(data, null, 2) + ';\n');
      renameSync(temporary, contentPath);
      res.writeHead(303, { Location: '/?saved=1' });
      res.end();
    } catch (error) {
      console.error(error);
      send(500, 'text/plain', 'Impossible de lire ou d’enregistrer le fichier de contenu.');
    }
  });
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const contentPath = fileURLToPath(new URL('../content.js', import.meta.url));
  adminServer(contentPath).listen(4173, '127.0.0.1', () => {
    console.log('Back-office Néotisse : http://127.0.0.1:4173/');
  });
}
