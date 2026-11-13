const menuLinks = [...document.querySelectorAll('header nav a')];
const sections = menuLinks.map((link) => document.getElementById(link.hash.slice(1)));
const editor = document.querySelector('#content-editor');
const tablist = document.querySelector('header nav');
tablist.setAttribute('role', 'tablist');
menuLinks.forEach((link, index) => {
  link.id = 'tab-' + sections[index].id;
  link.setAttribute('role', 'tab');
  link.setAttribute('aria-controls', sections[index].id);
  sections[index].setAttribute('role', 'tabpanel');
  sections[index].setAttribute('aria-labelledby', link.id);
  sections[index].tabIndex = 0;
  link.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % menuLinks.length;
    if (event.key === 'ArrowLeft') next = (index + menuLinks.length - 1) % menuLinks.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = menuLinks.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      menuLinks[next].click();
      menuLinks[next].focus();
    }
  });
});

function showSection(id) {
  const current = sections.find((section) => section.id === id) || sections[0];
  sections.forEach((section, index) => {
    section.hidden = section !== current;
    menuLinks[index].setAttribute('aria-selected', String(section === current));
    menuLinks[index].tabIndex = section === current ? 0 : -1;
    if (section === current) menuLinks[index].setAttribute('aria-current', 'true');
    else menuLinks[index].removeAttribute('aria-current');
  });
  editor.hidden = current.id === 'messages';
}

function showFromHash() {
  showSection(location.hash.slice(1));
}
window.addEventListener('hashchange', showFromHash);
editor.addEventListener('invalid', (event) => {
  const section = event.target.closest('section');
  if (section?.hidden) location.hash = section.id;
  if (section?.hidden) showSection(section.id);
}, true);
showFromHash();

document.querySelectorAll('form section').forEach((section) => {
  const add = section.querySelector('.add');
  if (!add) return;
  const records = section.querySelector('.records');
  const template = section.querySelector('template');
  add.addEventListener('click', () => {
    const item = template.content.cloneNode(true);
    const firstInput = item.querySelector('input');
    records.append(item);
    firstInput.focus();
  });
  records.addEventListener('click', (event) => {
    if (event.target.matches('.remove')) {
      event.target.closest('fieldset').remove();
      add.focus();
    }
  });
});
