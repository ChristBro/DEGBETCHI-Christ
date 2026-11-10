document.querySelectorAll('form section').forEach((section) => {
  const records = section.querySelector('.records');
  const template = section.querySelector('template');
  section.querySelector('.add').addEventListener('click', () => {
    const item = template.content.cloneNode(true);
    const firstInput = item.querySelector('input');
    records.append(item);
    firstInput.focus();
  });
  records.addEventListener('click', (event) => {
    if (event.target.matches('.remove')) {
      event.target.closest('fieldset').remove();
      section.querySelector('.add').focus();
    }
  });
});
