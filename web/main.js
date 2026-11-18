import { startViewer, PRESETS } from './app.js';

const $ = (id) => document.getElementById(id);
const form = $('controls');
const colourIds = ['la', 'ld', 'ls', 'ma', 'md', 'ms'];

function applyPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  colourIds.forEach((id) => { $(id).value = p[id]; });
  $('shininess').value = p.shininess;
}

function state() {
  return {
    mode: form.elements.mode.value,
    subdivisions: Number($('subdivisions').value),
    lightType: $('lightType').value,
    ...Object.fromEntries(colourIds.map((id) => [id, $(id).value])),
    shininess: Number($('shininess').value),
    texture: $('texture').value,
    showCone: $('showCone').checked,
    autoRotate: $('autoRotate').checked,
  };
}

function syncUi() {
  const s = state();
  document.querySelectorAll('[data-mode]').forEach((el) => { el.hidden = el.dataset.mode !== s.mode; });
  $('subOut').value = s.subdivisions;
  $('shinOut').value = s.shininess;
}

applyPreset('plastic');
$('autoRotate').checked = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
syncUi();

const viewer = startViewer($('view'), { state });
if (!viewer) {
  $('nogl').hidden = false;
} else {
  form.addEventListener('input', (e) => {
    if (e.target.id === 'preset') {
      applyPreset(e.target.value);
    } else if (colourIds.includes(e.target.id) || e.target.id === 'shininess') {
      $('preset').value = '';
    }
    syncUi();
    viewer.redraw();
  });
  $('reset').addEventListener('click', () => viewer.resetView());
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, select, textarea')) return;
    const modes = { 1: 'wire', 2: 'phong', 3: 'texture' };
    if (modes[e.key]) {
      form.elements.mode.value = modes[e.key];
      syncUi();
      viewer.redraw();
    }
  });
}
