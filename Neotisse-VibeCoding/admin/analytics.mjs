import { readFileSync, writeFileSync, renameSync } from 'node:fs';

const pageLabels = new Map([
  ['index.html', 'Accueil'], ['a-propos.html', 'À propos'], ['nos-actions.html', 'Nos actions'],
  ['agenda.html', 'Agenda'], ['evenement.html', 'Fiche agenda'], ['services.html', 'Services'],
  ['contact.html', 'Contact'], ['mentions-legales.html', 'Mentions légales'],
  ['politique-de-confidentialite.html', 'Confidentialité'], ['gestion-des-cookies.html', 'Cookies'],
]);
const dayMs = 86_400_000;
const retentionDays = 365;
const periods = new Map([[1, '1 jour'], [7, '1 semaine'], [30, '1 mois'], [365, '1 an']]);
const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const localDay = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'short', timeZone: 'Europe/Paris' });
const number = new Intl.NumberFormat('fr-FR');
const sum = (values) => values.reduce((total, value) => total + value, 0);
const heroLabels = new Map([['ateliers', 'Découvrir les ateliers'], ['actions', 'Nos actions']]);
const safe = (text) => text.replace(/[&<>]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[char]);

function readDays(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

export function recordAnalytics(path, name, page, eventId, value = '') {
  if (!pageLabels.has(page)) return false;
  const sequence = value.split('|');
  const valid = {
    page_view: !value || (sequence.length >= 2 && sequence.length <= 4 && sequence.at(-1) === page && sequence.every((item) => pageLabels.has(item))),
    contact_success: page === 'contact.html',
    workshop: page === 'services.html' && /^[a-z][a-z0-9-]{0,99}$/.test(value),
    hero: page === 'index.html' && heroLabels.has(value),
    duration: /^\d{1,4}$/.test(value) && Number(value) >= 1 && Number(value) <= 1800,
  };
  if (!Object.hasOwn(valid, name) || !valid[name]) return false;
  const days = readDays(path);
  const today = localDay.format(new Date());
  const counts = days[today] ??= { pages: {}, messages: 0 };
  if (name !== 'contact_success') {
    const ids = counts.ids ??= [];
    if (Object.values(days).some((day) => day.ids?.includes(eventId))) return true;
    if (ids.length >= 10_000) return false;
    ids.push(eventId);
  }
  const increment = (group, key) => {
    const items = counts[group] ??= {};
    items[key] = (Object.hasOwn(items, key) ? items[key] : 0) + 1;
  };
  if (name === 'page_view') {
    increment('pages', page);
    if (value) increment('paths', value);
  } else if (name === 'duration') {
    const durations = counts.durations ??= {};
    const sample = durations[page] ??= [0, 0];
    sample[0] += Number(value);
    sample[1] += 1;
  } else if (name === 'contact_success') counts.messages += 1;
  else increment(name === 'workshop' ? 'workshops' : 'hero', value);
  const cutoff = new Date(Date.parse(today) - (retentionDays - 1) * dayMs).toISOString().slice(0, 10);
  for (const day of Object.keys(days)) if (day < cutoff) delete days[day];
  writeFileSync(path + '.tmp', JSON.stringify(days), { mode: 0o600 });
  renameSync(path + '.tmp', path);
  return true;
}

function demoDay(date) {
  const day = Math.floor(date.valueOf() / dayMs);
  const activity = [1, 4, 8, 6, 12, 9, 3][day % 7] + (day % 5);
  return {
    pages: {
      'index.html': activity * 4, 'agenda.html': activity * 3,
      'evenement.html': activity * 2, 'services.html': activity + day % 4,
      'contact.html': Math.ceil(activity / 2), 'nos-actions.html': activity + day % 3,
    },
    messages: Math.floor(activity / 5),
    workshops: { 'filage-au-fuseau': activity * 3, 'teinture-naturelle': activity * 2 },
    paths: { 'index.html|services.html|contact.html': activity, 'index.html|agenda.html': activity * 2 },
    durations: { 'index.html': [activity * 120, activity * 4], 'services.html': [activity * 175, activity * 2] },
    hero: { ateliers: activity * 2, actions: activity },
  };
}

export function analyticsPage(path, period, demo = false, workshopLabels = new Map(), reset = false) {
  const requested = Number(period);
  const range = periods.has(requested) || requested === 90 ? requested : 7;
  const end = Date.parse(localDay.format(new Date()));
  const dates = Array.from({ length: range }, (_, index) => new Date(end - (range - index - 1) * dayMs));
  const options = range === 90 ? [...periods, [90, '90 jours']] : [...periods];
  const filter = options.map(([value, name]) => '<option value="' + value + '"' + (value === range ? ' selected' : '') + '>' + name + '</option>').join('');
  const annual = range === retentionDays;
  const chartLabel = annual ? 'Pages vues par mois' : 'Pages vues par jour';
  const modeLink = '/analytics?days=' + range + (demo ? '' : '&amp;mode=demo');
  let body;
  let status = 200;
  try {
    const days = demo ? {} : readDays(path);
    const selected = dates.map((date) => demo ? demoDay(date) : days[date.toISOString().slice(0, 10)] ?? { pages: {}, messages: 0 });
    const views = selected.map(({ pages }) => sum([...pageLabels.keys()].map((page) => pages[page] ?? 0)));
    const pages = [...pageLabels].map(([page, label]) => [label, sum(selected.map((day) => day.pages[page] ?? 0))]);
    const total = sum(views);
    const messages = sum(selected.map((day) => day.messages));
    const aggregate = (group) => {
      const totals = new Map();
      for (const day of selected) {
        for (const [key, count] of Object.entries(day[group] ?? {})) totals.set(key, (totals.get(key) ?? 0) + count);
      }
      return [...totals].sort((a, b) => b[1] - a[1]);
    };
    const durationRows = [...pageLabels].flatMap(([page, label]) => {
      const seconds = sum(selected.map((day) => day.durations?.[page]?.[0] ?? 0));
      const samples = sum(selected.map((day) => day.durations?.[page]?.[1] ?? 0));
      if (!samples) return [];
      const average = Math.round(seconds / samples);
      return [[label, Math.floor(average / 60) + ' min ' + (average % 60) + ' s · ' + number.format(samples) + ' mesures']];
    });
    const hero = new Map(aggregate('hero'));
    const heroTotal = sum([...hero.values()]);
    const panels = [
      ['Ateliers les plus vus', 'Un titre visible à l’écran par affichage de la page Ateliers.', aggregate('workshops').slice(0, 8)
        .map(([slug, count]) => [workshopLabels.get(slug) ?? slug.replaceAll('-', ' '), number.format(count) + ' vues'])],
      ['Ordre de visite des pages', 'Séquences observées de 2 à 4 pages, dans le même onglet.', aggregate('paths').slice(0, 8)
        .map(([key, count]) => [key.split('|').map((item) => pageLabels.get(item)).join(' → '), number.format(count)])],
      ['Temps moyen par page', 'Temps visible sur les visites dont la durée a été reçue.', durationRows],
      ['Premier clic sur l’accueil', 'Part parmi les premiers clics mesurés sur la bannière d’accueil.', [...heroLabels]
        .map(([key, label]) => {
          const clicks = hero.get(key) ?? 0;
          return [label, number.format(clicks) + (heroTotal ? ' · ' + Math.round(clicks / heroTotal * 100) + ' %' : ''), heroTotal ? clicks : undefined];
        })],
    ];
    const max = Math.max(1, ...views);
    const dailyRows = dates.map((date, i) => '<tr><th scope="row">' + dateFormat.format(date) + '</th><td><meter min="0" max="' + max
      + '" value="' + views[i] + '" aria-label="Pages vues"></meter> ' + number.format(views[i]) + '</td><td>' + number.format(selected[i].messages) + '</td></tr>').reverse().join('');
    const ranked = pages.filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
    const pageRows = ranked.slice(0, 6).map(([label, value]) =>
      '<li><span>' + label + '</span><strong>' + number.format(value) + '</strong><meter min="0" max="' + ranked[0][1] + '" value="' + value + '" aria-label="' + label + '"></meter></li>').join('');
    const months = new Map();
    if (annual) {
      dates.forEach((date, index) => {
        const month = monthFormat.format(date);
        months.set(month, (months.get(month) ?? 0) + views[index]);
      });
    }
    const points = annual ? [...months] : dates.map((date, index) => [dateFormat.format(date), views[index]]);
    const chartMax = Math.max(1, ...points.map(([, value]) => value));
    const bars = points.map(([label, value]) =>
      '<li title="' + label + ' · ' + number.format(value) + ' vues"><meter min="0" max="' + chartMax
      + '" value="' + value + '" aria-label="' + label + '"></meter></li>').join('');
    const kpis = [['Pages vues', total], ['Fiches agenda consultées', pages.find(([label]) => label === 'Fiche agenda')[1]],
      ['Messages reçus', messages], ['Pages différentes consultées', ranked.length]];
    body = `
      ${!demo && !total && !messages ? '<p class="analytics-empty">Aucune activité mesurée sur cette période. <a href="/apercu/gestion-des-cookies.html">Vérifier ou modifier le choix de mesure</a>, puis ouvrir une page de l’aperçu.</p>' : ''}
      <dl class="analytics-kpis">${kpis.map(([label, value]) => '<div><dt>' + label + '</dt><dd>' + number.format(value) + '</dd></div>').join('')}</dl>
      <div class="analytics-grid">
        <section class="analytics-panel"><h2>${annual ? 'Fréquentation mensuelle' : 'Fréquentation quotidienne'}</h2><p>${chartLabel}</p>
          <ul class="analytics-chart" aria-label="${chartLabel}">${bars}</ul>
          <div class="analytics-axis"><span>${points[0][0]}</span><span>${points.at(-1)[0]}</span></div>
        </section>
        <section class="analytics-panel"><h2>Pages les plus vues</h2><p>Les six premières de la période</p>
          ${pageRows ? '<ol class="analytics-ranking">' + pageRows + '</ol>' : '<p>Aucune vue enregistrée.</p>'}
        </section>
      </div>
      <div class="analytics-grid analytics-extra">${panels.map(([title, caption, rows]) =>
        '<section class="analytics-panel"><h2>' + title + '</h2><p>' + caption + '</p>'
        + (rows.length ? '<ul class="analytics-ranking analytics-metrics">' + rows.map(([label, value, clicks]) =>
          '<li><span>' + safe(label) + '</span><strong>' + value + '</strong>'
          + (clicks !== undefined ? '<progress aria-label="' + safe(label) + '" max="' + heroTotal + '" value="' + clicks + '"></progress>' : '')
          + '</li>').join('') + '</ul>' : '<p>Aucune donnée sur cette période.</p>')
        + '</section>').join('')}</div>
      <details class="analytics-panel analytics-detail"><summary>Détail jour par jour</summary>
        <table><thead><tr><th scope="col">Jour</th><th scope="col">Pages vues</th><th scope="col">Messages reçus</th></tr></thead><tbody>${dailyRows}</tbody></table>
      </details>`;
  } catch (error) {
    console.error(error);
    status = 503;
    body = '<p role="alert" class="analytics-empty">Les statistiques sont temporairement indisponibles. Réessayez dans un instant.</p>';
  }
  return { status, html: `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Analytics | Néotisse</title><link rel="stylesheet" href="/admin.css"></head>
    <body><main class="analytics"><a href="/">← Administration</a>
    <div class="analytics-heading"><div><h1>Analytics</h1><p>Du ${dateFormat.format(dates[0])} au ${dateFormat.format(dates.at(-1))} inclus · Europe/Paris</p></div>
      <div class="analytics-actions"><a href="/apercu/index.html">Ouvrir l’aperçu local</a><a class="analytics-demo" href="${modeLink}">${demo ? 'Revenir aux mesures locales' : 'Voir la démo'}</a></div>
    </div>
    <div class="analytics-toolbar"><p${demo ? ' class="analytics-demo-notice"' : ''}>${demo ? '<strong>Mode démo</strong> · Données fictives pour la présentation.' : 'Source : aperçu local de Néotisse, après accord.'}</p>
      <form method="get" action="/analytics">${demo ? '<input type="hidden" name="mode" value="demo">' : ''}<label>Période<select name="days">${filter}</select></label><button type="submit">Afficher</button></form>
    </div>
    ${reset && !demo ? '<p class="feedback" role="status">Les statistiques locales ont été réinitialisées.</p>' : ''}
    <aside class="analytics-panel analytics-consent"><strong>Pour être comptés, les visiteurs doivent accepter la mesure d’audience.</strong>
      <p>Les visites de cet aperçu alimentent les statistiques du back-office après accord. Acceptez la mesure d’audience dans la bannière ou dans <a href="/apercu/gestion-des-cookies.html">Gestion des cookies</a>. </p></aside>
    ${body}
    ${demo ? '' : '<p><a class="analytics-reset" href="/analytics/reset">Réinitialiser les statistiques</a></p>'}</main></body></html>` };
}

export function resetAnalyticsPage(token) {
  return `<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Réinitialiser les statistiques | Néotisse</title><link rel="stylesheet" href="/admin.css">
    <main class="analytics"><h1>Réinitialiser les statistiques ?</h1>
    <p>Cette action efface définitivement toutes les statistiques locales, sur toutes les périodes. Les messages reçus et le contenu du site sont conservés.</p>
    <form method="post" action="/analytics/reset"><input type="hidden" name="token" value="${token}">
    <a href="/analytics">Annuler</a><button class="analytics-reset" type="submit">Confirmer la remise à zéro</button></form></main></html>`;
}
