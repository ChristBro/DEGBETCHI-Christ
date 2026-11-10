const menuLinks = [...document.querySelectorAll('header nav a')];
const sections = menuLinks.map((link) => document.getElementById(link.hash.slice(1)));
const editor = document.querySelector('#content-editor');

function showSection(id) {
  const current = sections.find((section) => section.id === id) || sections[0];
  sections.forEach((section, index) => {
    section.hidden = section !== current;
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
