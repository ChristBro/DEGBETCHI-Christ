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
  content.services?.forEach((service) => {
    const detail = document.getElementById(service.slug);
    if (detail?.classList.contains('atelier')) {
      detail.querySelector('h2').textContent = service.title;
      detail.querySelector('.split > div > p').textContent = service.description;
      const shortcut = document.querySelector('.atelier-index a[href="#' + service.slug + '"]');
      if (shortcut) shortcut.textContent = shortcut.textContent.split(' · ')[0] + ' · ' + service.title;
    }
    const card = document.querySelector('.linen-catalogue a[href="services.html#' + service.slug + '"]')?.closest('article');
    if (card) {
      card.querySelector('h3').textContent = service.title;
      card.querySelector('p').textContent = service.description;
    }
  });
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
    document.querySelectorAll('a[href="mailto:contact@neotisse.org"]').forEach((link) => {
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
      article.append(date, make('h3', event.title), make('p', event.description), place);
      if (event.url) {
        const link = make('a', 'Voir les détails ↗');
        link.href = event.url;
        link.className = 'text-link';
        article.append(link);
      }
      return article;
    }));
    if (!entries.length && !document.querySelector('.calendar')) {
      eventList.append(make('p', 'Aucun événement annoncé pour le moment.'));
    }
  }
  const guestbook = document.querySelector('.guestbook');
  if (guestbook) {
    guestbook.replaceChildren(...content.reviews.map((review) => {
      const figure = document.createElement('figure');
      const caption = [review.name, review.activity, review.demo ? 'Avis fictif' : ''].filter(Boolean).join(' · ');
      figure.append(make('blockquote', '« ' + review.quote + ' »'), make('figcaption', caption));
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
  const body = contact.elements.namedItem('body');
  if (new URLSearchParams(location.search).get('motif') === 'devis') subject.value = 'Devis';
  const email = content?.coordinates?.[0]?.email || 'contact@neotisse.org';
  const localPreview = location.hostname === '127.0.0.1' && location.pathname.startsWith('/apercu/');
  contact.action = 'mailto:' + email;
  if (localPreview) {
    const label = document.createElement('label');
    label.htmlFor = 'reply-email';
    label.textContent = 'Ton adresse e-mail';
    const input = document.createElement('input');
    input.id = 'reply-email';
    input.name = 'email';
    input.type = 'email';
    input.required = true;
    input.maxLength = 200;
    contact.prepend(label, input);
    const feedback = contact.querySelector('.note');
    feedback.setAttribute('role', 'status');
    feedback.textContent = 'Le message sera reçu dans le back-office local.';
    const sendButton = contact.querySelector('button');
    sendButton.textContent = 'Envoyer le message';
    contact.addEventListener('submit', async (event) => {
      event.preventDefault();
      sendButton.disabled = true;
      try {
        const response = await fetch('/messages/envoyer', { method: 'POST', body: new URLSearchParams(new FormData(contact)) });
        feedback.textContent = response.ok ? 'Message reçu dans le back-office.' : 'Envoi impossible. Vérifie les champs.';
        if (response.ok) contact.reset();
      } catch {
        feedback.textContent = 'Impossible de joindre le back-office.';
      } finally {
        sendButton.disabled = false;
      }
    });
  } else {
    contact.addEventListener('submit', (event) => {
      event.preventDefault();
      location.href = 'mailto:' + email + '?subject=' + encodeURIComponent(subject.value)
        + '&body=' + encodeURIComponent(body.value);
    });
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
