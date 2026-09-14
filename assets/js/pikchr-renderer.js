import Module from './pikchr/pikchr.speed.js';

const PIKCHR_DARK_MODE = 0x0002;
const pikchr = {
  loaded: false,
  async load() {
    if (!this.loaded) {
      this.instance = await Module();
      this.loaded = true;
    }
  },
  render(markup, darkMode) {
    const svg = this.instance.ccall(
      'pikchr',
      'string',
      ['string', 'string', 'number', 'number', 'number'],
      [markup, 'pikchr', darkMode ? PIKCHR_DARK_MODE : 0, 1, 1]
    );
    return svg;
  }
};

const sourceFor = (code) => code.textContent.replace(/\n$/, '');

const renderBlock = (code, darkMode) => {
  const source = sourceFor(code);
  const wrapper = document.createElement('figure');
  wrapper.className = 'pikchr-diagram';

  try {
    const template = document.createElement('template');
    template.innerHTML = pikchr.render(source, darkMode).trim();
    const svg = template.content.firstElementChild;

    if (!svg || svg.tagName.toLowerCase() !== 'svg') {
      throw new Error('Pikchr did not return an SVG diagram.');
    }

    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Pikchr diagram');
    wrapper.append(svg);
  } catch (error) {
    wrapper.classList.add('pikchr-error');
    const message = document.createElement('p');
    message.textContent = `Unable to render Pikchr: ${error.message}`;
    wrapper.append(message);
  }

  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = 'Show Pikchr source';
  const pre = document.createElement('pre');
  pre.textContent = source;
  details.append(summary, pre);
  wrapper.append(details);

  code.closest('pre').replaceWith(wrapper);
};

const renderAll = async () => {
  const blocks = [...document.querySelectorAll('pre > code.language-pikchr')];
  if (!blocks.length) return;

  await pikchr.load();
  const darkMode = document.documentElement.getAttribute('data-bs-theme') === 'dark';
  blocks.forEach((code) => renderBlock(code, darkMode));
};

const rerenderOnThemeChange = () => {
  const observer = new MutationObserver(() => {
    document.querySelectorAll('.pikchr-diagram').forEach((diagram) => {
      const source = diagram.querySelector('details pre')?.textContent ?? '';
      const code = document.createElement('code');
      code.className = 'language-pikchr';
      code.textContent = source;
      const pre = document.createElement('pre');
      pre.append(code);
      diagram.replaceWith(pre);
    });
    renderAll();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme'] });
};

renderAll().then(rerenderOnThemeChange);
