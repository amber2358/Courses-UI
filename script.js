const state = { blocks: [], selectedId: null, currentEditor: '', panX: 0, panY: 0 };
const el = {
  viewport: document.getElementById('viewport'), canvas: document.getElementById('canvas'), add: document.getElementById('addBlockBtn'), del: document.getElementById('deleteBlockBtn'),
  editor: document.getElementById('editor'), empty: document.getElementById('emptyHint'), perm: document.getElementById('permissionHint'), currentEditor: document.getElementById('currentEditorInput'), detailDialog: document.getElementById('detailDialog')
};
const inputs = { owner: ownerInput, title: titleInput, content: contentInput, width: widthInput, height: heightInput, x: xInput, y: yInput, textColor: textColorInput, bgColor: bgColorInput, details: detailsInput };

const createBlock = () => ({ id: crypto.randomUUID(), owner: state.currentEditor || '未指定', title: '新建模块', content: '拖动我，拉右下角改尺寸', width: 240, height: 140, x: 120 + state.blocks.length * 30, y: 80 + state.blocks.length * 30, textColor: '#0f172a', bgColor: '#bfdbfe', details: '这里可以补充更详细的信息。' });
const getBlock = () => state.blocks.find((b) => b.id === state.selectedId);
const canEdit = (b) => b && (!b.owner || b.owner === '未指定' || state.currentEditor.trim() === b.owner.trim());

function render() {
  el.canvas.style.transform = `translate(${state.panX}px, ${state.panY}px)`;
  el.canvas.innerHTML = '';
  state.blocks.forEach((b) => {
    const d = document.createElement('article');
    d.className = 'block' + (b.id === state.selectedId ? ' active' : '');
    d.dataset.id = b.id;
    d.style.left = `${b.x}px`; d.style.top = `${b.y}px`; d.style.width = `${b.width}px`; d.style.height = `${b.height}px`; d.style.color = b.textColor; d.style.background = b.bgColor;
    d.innerHTML = `<h3 class="title">${esc(b.title)}</h3><p class="content">${esc(b.content)}</p><small>修改人：${esc(b.owner || '未指定')}</small>`;
    d.addEventListener('click', (e) => { e.stopPropagation(); state.selectedId = b.id; syncEditor(); render(); });
    d.addEventListener('dblclick', (e) => { e.stopPropagation(); openDetails(b); });
    wireDragBlock(d, b);
    wireResizeObserve(d, b);
    el.canvas.appendChild(d);
  });
}

function wireDragBlock(node, block) {
  let sx = 0, sy = 0, ox = 0, oy = 0, moving = false;
  node.addEventListener('pointerdown', (e) => {
    if (!canEdit(block)) return;
    if (e.target === node && getComputedStyle(node).resize === 'both' && nearResizeHandle(node, e)) return;
    moving = true; sx = e.clientX; sy = e.clientY; ox = block.x; oy = block.y; node.setPointerCapture(e.pointerId);
  });
  node.addEventListener('pointermove', (e) => {
    if (!moving) return;
    block.x = ox + (e.clientX - sx); block.y = oy + (e.clientY - sy);
    node.style.left = `${block.x}px`; node.style.top = `${block.y}px`;
    if (state.selectedId === block.id) { inputs.x.value = Math.round(block.x); inputs.y.value = Math.round(block.y); }
  });
  node.addEventListener('pointerup', () => { moving = false; });
}

function nearResizeHandle(node, e) { const r = node.getBoundingClientRect(); return e.clientX > r.right - 18 && e.clientY > r.bottom - 18; }
function wireResizeObserve(node, block) {
  const ro = new ResizeObserver(() => {
    block.width = Math.round(node.offsetWidth); block.height = Math.round(node.offsetHeight);
    if (state.selectedId === block.id) { inputs.width.value = block.width; inputs.height.value = block.height; }
  }); ro.observe(node);
}

function syncEditor() {
  const b = getBlock();
  if (!b) { el.editor.classList.add('hidden'); el.empty.classList.remove('hidden'); el.perm.classList.add('hidden'); return; }
  el.editor.classList.remove('hidden'); el.empty.classList.add('hidden');
  Object.entries(inputs).forEach(([k, i]) => i.value = b[k]);
  const editable = canEdit(b); Object.values(inputs).forEach((i) => i.disabled = !editable); el.del.disabled = !editable;
  el.perm.classList.toggle('hidden', editable); el.perm.textContent = editable ? '' : `当前块限定修改人为「${b.owner}」，你是「${state.currentEditor || '未填写'}」，仅可查看。`;
}

Object.entries(inputs).forEach(([k, i]) => i.addEventListener('input', () => { const b = getBlock(); if (!canEdit(b)) return; b[k] = (['width','height','x','y'].includes(k) ? Number(i.value) || 0 : i.value); render(); }));
el.currentEditor.addEventListener('input', () => { state.currentEditor = el.currentEditor.value.trim(); syncEditor(); render(); });
el.add.addEventListener('click', () => { const b = createBlock(); state.blocks.push(b); state.selectedId = b.id; syncEditor(); render(); });
el.del.addEventListener('click', () => { const b = getBlock(); if (!canEdit(b)) return; state.blocks = state.blocks.filter((x) => x.id !== b.id); state.selectedId = state.blocks.at(-1)?.id ?? null; syncEditor(); render(); });
el.canvas.addEventListener('click', () => { state.selectedId = null; syncEditor(); render(); });

(function wirePanViewport() {
  let down = false, sx = 0, sy = 0, ox = 0, oy = 0;
  el.viewport.addEventListener('pointerdown', (e) => { if (e.target !== el.viewport) return; down = true; sx = e.clientX; sy = e.clientY; ox = state.panX; oy = state.panY; el.viewport.classList.add('grabbing'); });
  el.viewport.addEventListener('pointermove', (e) => { if (!down) return; state.panX = ox + (e.clientX - sx); state.panY = oy + (e.clientY - sy); render(); });
  window.addEventListener('pointerup', () => { down = false; el.viewport.classList.remove('grabbing'); });
})();

function openDetails(b) { dialogTitle.textContent = b.title; dialogContent.textContent = b.content; dialogOwner.textContent = `限定修改人：${b.owner || '未指定'}`; dialogDetails.textContent = b.details || '暂无'; el.detailDialog.showModal(); }
function esc(v) { return String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }

state.currentEditor = '张三'; el.currentEditor.value = state.currentEditor; const b = createBlock(); state.blocks.push(b); state.selectedId = b.id; syncEditor(); render();
