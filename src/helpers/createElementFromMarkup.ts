import cleanHTML from '../vendor/cleanHTML';

export default function createElementFromMarkup<T = Element>(markup: string, sanitize = false) {
  const div = document.createElement('div');
  div.innerHTML = (sanitize ? cleanHTML(markup) : markup).trim();
  return div.firstElementChild as T;
}
