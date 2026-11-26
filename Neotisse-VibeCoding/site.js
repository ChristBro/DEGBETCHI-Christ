const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 700px)');

function syncMenu() {
  menu.hidden = !mobile.matches;
  navigation.hidden = mobile.matches && menu.getAttribute('aria-expanded') === 'false';
}

menu.addEventListener('click', () => {
  menu.setAttribute('aria-expanded', String(menu.getAttribute('aria-expanded') === 'false'));
  syncMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && mobile.matches && menu.getAttribute('aria-expanded') === 'true') {
    menu.setAttribute('aria-expanded', 'false');
    syncMenu();
    menu.focus();
  }
});
mobile.addEventListener('change', syncMenu);
syncMenu();

const content = window.neotisseContent;
if (content) {
  const make = (tag, value) => {
    const element = document.createElement(tag);
    element.textContent = value;
    return element;
  };
  if (content.services) {
    const servicePhoto = (service) => {
      const image = document.createElement('img');
      image.src = 'assets/' + (service.image || 'ceintures.jpg');
      image.alt = service.title;
      image.loading = 'lazy';
      return image;
    };
    const catalogue = document.querySelector('.neotisse-catalogue .cards');
    const shortcuts = document.querySelector('.atelier-index');
    const oldDetails = [...document.querySelectorAll('.atelier')];
    const detailParent = oldDetails[0]?.parentElement || document.querySelector('#ateliers')?.parentElement;
    const marker = oldDetails[0] || document.querySelector('#ateliers')?.nextElementSibling;
    catalogue?.replaceChildren();
    shortcuts?.replaceChildren();
    content.services.forEach((service, index) => {
      if (catalogue) {
        const card = document.createElement('article');
        const copy = document.createElement('div');
        const link = make('a', 'Découvrir l’atelier ↗');
        link.className = 'text-link';
        link.href = 'services.html#' + service.slug;
        copy.append(make('h3', service.title), make('p', service.description), link);
        card.append(servicePhoto(service), copy);
        catalogue.append(card);
      }
      if (shortcuts) {
        const link = make('a', String(index + 1).padStart(2, '0') + ' · ' + service.title);
        link.href = '#' + service.slug;
        shortcuts.append(link);
      }
      if (detailParent) {
        const wrapper = document.createElement('div');
        wrapper.id = service.slug;
        wrapper.className = 'atelier';
        const section = document.createElement('section');
        section.className = 'split' + (index % 2 ? ' reverse' : '');
        const copy = document.createElement('div');
        const link = make('a', 'Demander un devis');
        link.className = 'button';
        link.href = 'contact.html?motif=devis';
        copy.append(make('h2', service.title), make('p', service.description), link);
        section.append(servicePhoto(service), copy);
        wrapper.append(section);
        detailParent.insertBefore(wrapper, marker);
      }
    });
    oldDetails.forEach((detail) => detail.remove());
    if (!content.services.length) {
      catalogue?.append(make('p', 'Les prochains ateliers seront annoncés ici.'));
      shortcuts?.append(make('p', 'Aucune prestation annoncée pour le moment.'));
    }
    if (shortcuts && location.hash) {
      const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (target?.classList.contains('atelier')) requestAnimationFrame(() => target.scrollIntoView());
    }
  }
  if (content.partners) {
    document.querySelectorAll('.partner-logos').forEach((list) => {
      list.replaceChildren(...content.partners.map((partner, index) => {
        const item = document.createElement('li');
        item.style.setProperty('--logo-order', index);
        if (partner.image) {
          const logo = document.createElement('img');
          logo.src = 'assets/partenaires/' + partner.image;
          logo.alt = '';
          logo.loading = 'lazy';
          item.append(logo);
        }
        item.append(make('span', partner.name));
        return item;
      }));
    });
  }
  const coordinates = content.coordinates?.[0];
  if (coordinates) {
    document.querySelectorAll('[data-contact-city]').forEach((place) => { place.textContent = coordinates.city; });
    document.querySelectorAll('a[href="mailto:asso.neotisse@gmail.com"]').forEach((link) => {
      link.href = 'mailto:' + coordinates.email;
      link.textContent = coordinates.email;
    });
    document.querySelectorAll('footer a[href*="instagram.com"]').forEach((link) => {
      if (coordinates.instagram) link.href = coordinates.instagram;
      else link.hidden = true;
    });
  }
  const eventList = document.querySelector('.events');
  if (eventList) {
    const format = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' });
    const ordered = [...content.events].sort((a, b) => a.date.localeCompare(b.date));
    const entries = document.querySelector('.calendar') ? ordered : ordered.slice(0, 3);
    eventList.replaceChildren(...entries.map((event, index) => {
      const article = document.createElement('article');
      article.dataset.month = event.date.slice(0, 7);
      article.id = 'evenement-' + event.date + '-' + (index + 1);
      const date = make('time', [format.format(new Date(event.date + 'T12:00:00')), event.time].filter(Boolean).join(' · '));
      date.dateTime = event.date;
      const place = make('p', [event.demo ? 'Exemple fictif' : '', event.place].filter(Boolean).join(' · '));
      place.className = 'note';
      article.append(make('h3', event.title), date, make('p', event.description), place);
      const link = make('a', 'Voir les détails ↗');
      link.href = 'evenement.html?' + new URLSearchParams({ date: event.date, titre: event.title });
      link.className = 'text-link';
      article.append(link);
      return article;
    }));
    if (!entries.length && !document.querySelector('.calendar')) {
      eventList.append(make('p', 'Aucun événement annoncé pour le moment.'));
    }
  }
  const eventDetail = document.querySelector('#event-detail');
  if (eventDetail) {
    const params = new URLSearchParams(location.search);
    const event = content.events.find((item) => item.date === params.get('date') && item.title === params.get('titre'));
    if (event) {
      document.querySelector('#event-title').textContent = event.title;
      document.title = event.title + ' · Néotisse';
      const date = make('p', [new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(event.date + 'T12:00:00')), event.time].filter(Boolean).join(' · '));
      eventDetail.replaceChildren(date, make('p', event.place), make('p', event.description));
      if (event.demo) eventDetail.append(make('p', 'Événement fictif présenté à titre de démonstration.'));
      if (event.url && !event.url.includes('silver-lolly-6cfc5f.netlify.app')) {
        const external = make('a', 'Informations complémentaires ↗');
        external.href = event.url;
        eventDetail.append(external);
      }
    } else {
      document.querySelector('#event-title').textContent = 'Événement introuvable';
      eventDetail.replaceChildren(make('p', 'Cet événement a été modifié ou retiré de l’agenda.'));
    }
    const back = make('a', 'Retour à l’agenda');
    back.href = 'agenda.html#rendez-vous';
    back.className = 'button';
    const row = document.createElement('p');
    row.append(back);
    eventDetail.append(row);
  }
  const guestbook = document.querySelector('.guestbook');
  if (guestbook) {
    guestbook.replaceChildren(...content.reviews.map((review) => {
      const figure = document.createElement('figure');
      const caption = [review.name, review.activity, review.demo ? 'Avis fictif' : ''].filter(Boolean).join(' · ');
      figure.append(make('blockquote', '«\u00a0' + review.quote.trim() + '\u00a0»'), make('figcaption', caption));
      return figure;
    }));
    if (!content.reviews.length) guestbook.append(make('p', 'Aucun avis publié pour le moment.'));
  }
}


const calendar = document.querySelector('.calendar');
if (calendar) {
  const monthHeading = calendar.querySelector('#calendar-month');
  const days = calendar.querySelector('.calendar-days');
  const empty = document.querySelector('#calendar-empty');
  const events = [...document.querySelectorAll('.events article[data-month]')];
  const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' });
  const month = events.length ? new Date(events[0].querySelector('time').dateTime + 'T12:00:00') : new Date();
  month.setDate(1);

  events.forEach((event) => {
    event.id ||= 'evenement-' + event.querySelector('time').dateTime;
    event.tabIndex = -1;
  });

  function renderCalendar() {
    monthHeading.textContent = monthFormat.format(month);
    days.replaceChildren();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const monthKey = year + '-' + String(monthIndex + 1).padStart(2, '0');
    const firstColumn = (month.getDay() + 6) % 7 + 1;
    const dayCount = new Date(year, monthIndex + 1, 0).getDate();
    const eventsByDay = new Map();

    events.forEach((event) => {
      event.hidden = event.dataset.month !== monthKey;
      if (!event.hidden) {
        const day = Number(event.querySelector('time').dateTime.slice(-2));
        if (!eventsByDay.has(day)) eventsByDay.set(day, event);
      }
    });
    empty.hidden = eventsByDay.size > 0;

    for (let day = 1; day <= dayCount; day++) {
      const event = eventsByDay.get(day);
      const cell = document.createElement(event ? 'a' : 'span');
      cell.textContent = day;
      if (day === 1) cell.style.gridColumnStart = firstColumn;
      if (event) {
        const title = event.querySelector('h3').textContent;
        cell.href = '#' + event.id;
        cell.setAttribute('aria-label', dayFormat.format(new Date(year, monthIndex, day)) + ' : ' + title);
        cell.addEventListener('click', () => event.focus({ preventScroll: true }));
      }
      days.append(cell);
    }
  }

  calendar.querySelectorAll('[data-calendar-step]').forEach((button) => {
    button.addEventListener('click', () => {
      month.setMonth(month.getMonth() + Number(button.dataset.calendarStep));
      renderCalendar();
    });
  });
  renderCalendar();
  calendar.hidden = false;
}

const contact = document.querySelector('#contact-form');
if (contact) {
  const subject = contact.elements.namedItem('subject');
  if (new URLSearchParams(location.search).get('motif') === 'devis') subject.value = 'Devis';
  const localPreview = location.hostname === '127.0.0.1' && location.pathname.startsWith('/apercu/');
  if (location.protocol === 'file:') {
    location.replace('http://127.0.0.1:4181/apercu/contact.html' + location.search);
  }
  if (localPreview) {
    const feedback = contact.querySelector('.note');
    feedback.setAttribute('role', 'status');
    feedback.textContent = '';
    const sendButton = contact.querySelector('button');
    sendButton.textContent = 'Envoyer le message';
    contact.addEventListener('submit', async (event) => {
      event.preventDefault();
      sendButton.disabled = true;
      try {
        const body = new URLSearchParams(new FormData(contact));
        if (analyticsAllowed()) body.set('analytics', '1');
        const response = await fetch('/messages/envoyer', { method: 'POST', body });
        feedback.textContent = response.ok ? 'Votre message a bien été envoyé.'
          : response.status === 400 ? 'Vérifiez les champs du formulaire.'
          : 'Le back-office n’a pas pu enregistrer votre message.';
        if (response.ok) contact.reset();
      } catch {
        feedback.textContent = 'Impossible de joindre le back-office.';
      } finally {
        sendButton.disabled = false;
      }
    });
  } else {
    contact.querySelector('.note').textContent = 'L’envoi direct est disponible dans l’aperçu local. Contactez-nous par e-mail pour une demande en ligne.';
    contact.querySelector('button').disabled = true;
    contact.addEventListener('submit', (event) => event.preventDefault());
  }
}

const partnerLogos = document.querySelector('.partner-logos');
if (partnerLogos && 'IntersectionObserver' in window) {
  const observeLogos = new IntersectionObserver(([entry], observer) => {
    if (entry.isIntersecting) {
      partnerLogos.classList.add('is-in-view');
      observer.disconnect();
    }
  }, { threshold: 0.1 });
  observeLogos.observe(partnerLogos);
}


const textile = document.querySelector('.textile-scroll');
const textileMotion = window.matchMedia('(prefers-reduced-motion: no-preference)');
if (textile) {
  const clamp = (value) => Math.max(0, Math.min(1, value));
  let frame = 0;

  function drawTextile() {
    frame = 0;
    const distance = document.documentElement.scrollHeight - window.innerHeight;
    const progress = distance > 0 ? clamp(window.scrollY / distance) : 0;
    textile.style.setProperty('--root-growth', clamp(progress * 1.8));
    textile.style.setProperty('--root-branches', clamp((progress - .16) * 1.45));
    textile.style.setProperty('--woven', progress);
    textile.style.setProperty('--spun', clamp((progress - .28) * 1.4));
    textile.style.setProperty('--spindle-angle', (progress * 1080) + 'deg');
  }

  function scheduleTextile() {
    if (textileMotion.matches && !frame) frame = requestAnimationFrame(drawTextile);
  }

  function syncTextile() {
    textile.classList.toggle('is-active', textileMotion.matches);
    scheduleTextile();
  }

  window.addEventListener('scroll', scheduleTextile, { passive: true });
  window.addEventListener('resize', scheduleTextile);
  window.addEventListener('load', scheduleTextile);
  textileMotion.addEventListener('change', syncTextile);
  if ('ResizeObserver' in window) new ResizeObserver(scheduleTextile).observe(document.body);
  syncTextile();
}

const subjectSelect = document.querySelector('#contact-form select[name="subject"]');
if (subjectSelect) {
  const picker = document.createElement('div');
  picker.className = 'subject-picker';
  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'subject-trigger';
  trigger.id = 'subject-trigger';
  trigger.setAttribute('aria-haspopup', 'listbox');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'subject-options');
  trigger.setAttribute('aria-labelledby', 'subject-label subject-value');
  const value = document.createElement('span');
  value.id = 'subject-value';
  const arrow = document.createElement('span');
  arrow.className = 'subject-arrow';
  arrow.textContent = '⌄';
  arrow.setAttribute('aria-hidden', 'true');
  trigger.append(value, arrow);
  const list = document.createElement('div');
  list.id = 'subject-options';
  list.className = 'subject-options';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-labelledby', 'subject-label');
  list.hidden = true;
  const label = document.querySelector('label[for="subject"]');
  label.id = 'subject-label';
  label.htmlFor = trigger.id;
  const options = [...subjectSelect.options].filter((option) => option.value).map((option, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'option');
    button.tabIndex = -1;
    button.textContent = option.textContent;
    button.dataset.value = option.value;
    button.style.setProperty('--choice', index);
    button.addEventListener('click', () => {
      subjectSelect.value = option.value;
      subjectSelect.dispatchEvent(new Event('change', { bubbles: true }));
      closePicker(true);
    });
    list.append(button);
    return button;
  });

  function syncSubject() {
    value.textContent = subjectSelect.selectedOptions[0]?.textContent || 'Choisir un motif';
    options.forEach((button) => button.setAttribute('aria-selected', String(button.dataset.value === subjectSelect.value)));
    trigger.removeAttribute('aria-invalid');
  }
  function closePicker(focus) {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (focus) trigger.focus();
  }
  function openPicker(index) {
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const selected = options.findIndex((button) => button.dataset.value === subjectSelect.value);
    options[index ?? Math.max(0, selected)].focus();
  }
  trigger.addEventListener('click', () => {
    if (list.hidden) openPicker();
    else closePicker(false);
  });
  trigger.addEventListener('keydown', (event) => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault();
      openPicker(event.key === 'ArrowUp' ? options.length - 1 : 0);
    }
  });
  list.addEventListener('keydown', (event) => {
    const current = options.indexOf(document.activeElement);
    let next;
    if (event.key === 'ArrowDown') next = (current + 1) % options.length;
    if (event.key === 'ArrowUp') next = (current + options.length - 1) % options.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = options.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      options[next].focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closePicker(true);
    } else if (event.key.length === 1) {
      const match = options.find((button) => button.textContent.toLocaleLowerCase().startsWith(event.key.toLocaleLowerCase()));
      if (match) { event.preventDefault(); match.focus(); }
    }
  });
  document.addEventListener('click', (event) => {
    if (!picker.contains(event.target)) closePicker(false);
  });
  picker.addEventListener('focusout', (event) => {
    if (!picker.contains(event.relatedTarget)) closePicker(false);
  });
  subjectSelect.addEventListener('change', syncSubject);
  subjectSelect.addEventListener('invalid', (event) => {
    event.preventDefault();
    trigger.setAttribute('aria-invalid', 'true');
    trigger.focus();
    openPicker();
  });
  subjectSelect.form.addEventListener('reset', () => {
    setTimeout(syncSubject, 0);
    closePicker(false);
  });
  subjectSelect.classList.add('subject-native');
  subjectSelect.tabIndex = -1;
  subjectSelect.setAttribute('aria-hidden', 'true');
  subjectSelect.after(picker);
  picker.append(trigger, list);
  syncSubject();
}

const localAnalytics = location.hostname === '127.0.0.1' && location.pathname.startsWith('/apercu/');
// Renseigner l'identifiant du flux Web GA4 dans cette constante avant le déploiement.
const gaMeasurementId = 'G-X0CKCZBF1V';
const publicGa = !localAnalytics && location.protocol === 'https:' && /^G-[A-Z0-9]+$/.test(gaMeasurementId);
const cookieKey = localAnalytics ? 'neotisse-local-audience-choice' : publicGa ? 'neotisse-ga4-choice' : 'neotisse-cookie-choice';
const cookieLifetime = 183 * 24 * 60 * 60 * 1000;
const cookieBanner = document.createElement('aside');
cookieBanner.className = localAnalytics ? 'neotisse-audience' : 'cookie-banner';
cookieBanner.setAttribute('aria-label', 'Vos choix de confidentialité');
cookieBanner.hidden = true;
cookieBanner.innerHTML = '<div><h2>Vos choix de confidentialité</h2><p>Néotisse mémorise votre choix pour cette bannière. Aucun cookie publicitaire ni outil de mesure d’audience n’est activé.</p><a href="gestion-des-cookies.html">En savoir plus sur les cookies</a></div>'
  + '<div class="cookie-actions"><button type="button" class="button" data-choice="accepted">Tout accepter</button><button type="button" class="button" data-choice="refused">Tout refuser</button><button type="button" class="cookie-details-toggle" aria-expanded="false" aria-controls="cookie-details">Personnaliser</button></div>'
  + '<div id="cookie-details" hidden><p><strong>Mémorisation de votre choix</strong> — conservée sur cet appareil pendant six mois.</p><p><strong>Cookies facultatifs</strong> — aucun service facultatif actuellement activé. Vous pouvez accepter ou refuser ci-dessus.</p></div>';
if (localAnalytics) {
  cookieBanner.querySelector('div > p').textContent = 'Avec votre accord, cet aperçu local mesure les pages et ateliers consultés, le parcours dans cet onglet, le temps d’affichage, le premier clic sur la bannière d’accueil et les messages reçus.';
  cookieBanner.querySelector('#cookie-details p:last-child').textContent = 'La mesure conserve des totaux par jour et un code aléatoire par événement pour éviter les doublons. Les dernières pages sont mémorisées dans cet onglet. Aucun identifiant de visiteur, e-mail ou texte de message n’entre dans les statistiques.';
}
if (publicGa) {
  cookieBanner.querySelector('div > p').textContent = "Avec votre accord, Google Analytics mesure les pages consultées sur le site.";
  cookieBanner.querySelector('#cookie-details p:last-child').textContent = "La mesure est facultative. Vous pouvez modifier votre choix depuis la page Gestion des cookies.";
  document.querySelectorAll('[data-ga-notice]').forEach((notice) => {
    notice.textContent = "Google Analytics mesure les consultations après accord. Vous pouvez retirer cet accord depuis la page Gestion des cookies.";
  });
}
document.body.append(cookieBanner);
let viewRecorded = false;
const visitKey = 'neotisse-recent-pages';
let visibleSince = null;
let visibleTime = 0;
let durationSent = false;
let firstHeroClick = false;
const workshopsSeen = new Set();
let savedChoice;
try {
  savedChoice = JSON.parse(localStorage.getItem(cookieKey));
} catch {
  savedChoice = null;
}
function validCookieChoice(choice) {
  return ['accepted', 'refused'].includes(choice?.value)
    && Number.isFinite(choice.savedAt)
    && Date.now() >= choice.savedAt
    && Date.now() - choice.savedAt < cookieLifetime;
}
let gaStarted = false;
function updatePublicAnalytics() {
  if (!publicGa) return;
  const allowed = validCookieChoice(savedChoice) && savedChoice.value === 'accepted';
  window['ga-disable-' + gaMeasurementId] = !allowed;
  if (!allowed || gaStarted) return;
  gaStarted = true;
  window.dataLayer = window.dataLayer || [];
  const gtag = function () { window.dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', gaMeasurementId, {
    page_location: location.origin + location.pathname,
    page_referrer: '',
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + gaMeasurementId;
  document.head.append(tag);
}
function analyticsAllowed() {
  return localAnalytics && validCookieChoice(savedChoice) && savedChoice.value === 'accepted';
}
function sendMeasurement(name, value = '') {
  if (!analyticsAllowed()) return;
  const page = location.pathname.split('/').at(-1);
  const body = new URLSearchParams({ page, event_id: crypto.randomUUID() });
  if (name !== 'page_view') body.set('name', name);
  if (value) body.set('value', value);
  fetch('/analytics/view', { method: 'POST', body, keepalive: true, referrerPolicy: 'origin' }).catch(() => {});
}
function visitSequence(page) {
  try {
    const now = Date.now();
    const previous = JSON.parse(sessionStorage.getItem(visitKey));
    const pages = previous && now - previous.at < 30 * 60 * 1000 ? previous.pages.slice(-3) : [];
    if (pages.at(-1) === page) {
      sessionStorage.setItem(visitKey, JSON.stringify({ at: now, pages }));
      return '';
    }
    pages.push(page);
    sessionStorage.setItem(visitKey, JSON.stringify({ at: now, pages }));
    return pages.length > 1 ? pages.join('|') : '';
  } catch { return ''; }
}
function pauseVisibleTime() {
  if (visibleSince !== null) visibleTime += performance.now() - visibleSince;
  visibleSince = null;
}
function recordPageView() {
  if (viewRecorded || !analyticsAllowed()) return;
  viewRecorded = true;
  const page = location.pathname.split('/').at(-1);
  sendMeasurement('page_view', visitSequence(page));
  if (document.visibilityState === 'visible') visibleSince = performance.now();
  if (page === 'services.html' && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        const slug = target.closest('.atelier')?.id;
        if (!isIntersecting || document.visibilityState !== 'visible' || !analyticsAllowed() || !slug || workshopsSeen.has(slug)) continue;
        workshopsSeen.add(slug);
        sendMeasurement('workshop', slug);
        observer.unobserve(target);
      }
    }, { threshold: 0.5 });
    document.querySelectorAll('.atelier h2').forEach((title) => observer.observe(title));
  }
}
function clearVisitOnRefusal() {
  if (analyticsAllowed()) return;
  visibleSince = null;
  visibleTime = 0;
  try { sessionStorage.removeItem(visitKey); } catch {}
}
if (localAnalytics) {
  document.addEventListener('visibilitychange', () => {
    pauseVisibleTime();
    if (!durationSent && viewRecorded && analyticsAllowed() && document.visibilityState === 'visible') visibleSince = performance.now();
  });
  window.addEventListener('pagehide', () => {
    pauseVisibleTime();
    const seconds = Math.min(1800, Math.floor(visibleTime / 1000));
    if (!durationSent && seconds > 0 && analyticsAllowed()) {
      durationSent = true;
      sendMeasurement('duration', String(seconds));
    }
  });
  document.querySelectorAll('.home-hero-links a').forEach((link) => link.addEventListener('click', () => {
    const action = { 'services.html': 'ateliers', 'nos-actions.html': 'actions' }[link.getAttribute('href')];
    if (!action || firstHeroClick || !analyticsAllowed()) return;
    firstHeroClick = true;
    sendMeasurement('hero', action);
  }));
}
window.addEventListener('storage', (event) => {
  if (event.key !== cookieKey && event.key !== null) return;
  try { savedChoice = JSON.parse(event.newValue); }
  catch { savedChoice = null; }
  clearVisitOnRefusal();
  cookieBanner.hidden = validCookieChoice(savedChoice);
  showCookieStatus();
  updatePublicAnalytics();
  recordPageView();
});
function showCookieStatus() {
  const status = document.querySelector('.cookie-status');
  if (status) status.textContent = validCookieChoice(savedChoice)
    ? (savedChoice.value === 'accepted' ? 'Votre choix actuel : tout accepter.' : 'Votre choix actuel : tout refuser.')
    : 'Aucun choix mémorisé.';
}
cookieBanner.hidden = validCookieChoice(savedChoice);
showCookieStatus();
updatePublicAnalytics();
recordPageView();
function saveAudienceChoice(value) {
    savedChoice = { value, savedAt: Date.now() };
    clearVisitOnRefusal();
    try {
      localStorage.setItem(cookieKey, JSON.stringify(savedChoice));
    } catch {
      // The choice applies to this page when browser storage is unavailable.
    }
    cookieBanner.hidden = true;
    showCookieStatus();
    updatePublicAnalytics();
    recordPageView();
    document.querySelector('[data-cookie-settings]')?.focus({ preventScroll: true });
}
cookieBanner.querySelectorAll('[data-choice]').forEach((button) => {
  button.addEventListener('click', () => saveAudienceChoice(button.dataset.choice));
});
const detailsToggle = cookieBanner.querySelector('.cookie-details-toggle');
detailsToggle.addEventListener('click', () => {
  const details = cookieBanner.querySelector('#cookie-details');
  details.hidden = !details.hidden;
  detailsToggle.setAttribute('aria-expanded', String(!details.hidden));
});
document.querySelectorAll('[data-cookie-settings]').forEach((button) => {
  button.addEventListener('click', () => {
    cookieBanner.hidden = false;
    cookieBanner.querySelector('button').focus({ preventScroll: true });
  });
});
if (localAnalytics) {
  const status = document.querySelector('.cookie-status');
  if (status) {
    const note = document.createElement('p');
    note.textContent = 'Dans cet aperçu local, la mesure facultative compte les pages et ateliers consultés, leur ordre de visite, le temps d’affichage, le premier clic sur la bannière d’accueil et les messages reçus. Les parcours sont mesurés dans le même onglet.';
    const controls = document.createElement('div');
    controls.className = 'measurement-actions';
    for (const [value, label] of [['accepted', 'Accepter la mesure d’audience'], ['refused', 'Refuser la mesure d’audience']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'button';
      button.textContent = label;
      button.addEventListener('click', () => saveAudienceChoice(value));
      controls.append(button);
    }
    document.querySelector('[data-cookie-settings]')?.setAttribute('hidden', '');
    status.before(note, controls);
  }
}
