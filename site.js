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

const calendar = document.querySelector('.calendar');
if (calendar) {
  const monthHeading = calendar.querySelector('#calendar-month');
  const days = calendar.querySelector('.calendar-days');
  const empty = document.querySelector('#calendar-empty');
  const events = [...document.querySelectorAll('.events article[data-month]')];
  const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
  const dayFormat = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'full' });
  const month = new Date(events[0].querySelector('time').dateTime + 'T12:00:00');
  month.setDate(1);

  events.forEach((event) => {
    event.id = 'evenement-' + event.querySelector('time').dateTime;
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
        eventsByDay.set(day, event);
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
  contact.addEventListener('submit', (event) => {
    event.preventDefault();
    location.href = 'mailto:contact@neotisse.org?subject=' + encodeURIComponent(subject.value)
      + '&body=' + encodeURIComponent(body.value);
  });
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
