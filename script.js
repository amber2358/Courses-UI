const state = {
  blocks: [],
  selectedId: null,
};

const canvas = document.getElementById('canvas');
const addBlockBtn = document.getElementById('addBlockBtn');
const deleteBlockBtn = document.getElementById('deleteBlockBtn');
const editor = document.getElementById('editor');
const emptyHint = document.getElementById('emptyHint');
const detailDialog = document.getElementById('detailDialog');

const inputs = {
  title: document.getElementById('titleInput'),
  content: document.getElementById('contentInput'),
  width: document.getElementById('widthInput'),
  height: document.getElementById('heightInput'),
  textColor: document.getElementById('textColorInput'),
  bgColor: document.getElementById('bgColorInput'),
  details: document.getElementById('detailsInput'),
};

const createBlock = () => ({
  id: crypto.randomUUID(),
  title: '新建模块',
  content: '点击右侧编辑内容',
  width: 220,
  height: 140,
  textColor: '#0f172a',
  bgColor: '#bfdbfe',
  details: '这里可以补充更详细的信息。',
});

function render() {
  canvas.innerHTML = '';

  state.blocks.forEach((block) => {
    const el = document.createElement('article');
    el.className = 'block' + (state.selectedId === block.id ? ' active' : '');
    el.style.width = `${block.width}px`;
    el.style.height = `${block.height}px`;
    el.style.color = block.textColor;
    el.style.background = block.bgColor;
    el.innerHTML = `
      <h3 class="title">${escapeHtml(block.title)}</h3>
      <p class="content">${escapeHtml(block.content)}</p>
      <small>点击进入详情</small>
    `;

    el.addEventListener('click', () => {
      state.selectedId = block.id;
      syncEditor();
      render();
    });

    el.addEventListener('dblclick', () => {
      openDetails(block);
    });

    canvas.appendChild(el);
  });
}

function getSelectedBlock() {
  return state.blocks.find((x) => x.id === state.selectedId);
}

function syncEditor() {
  const block = getSelectedBlock();
  if (!block) {
    editor.classList.add('hidden');
    emptyHint.classList.remove('hidden');
    return;
  }

  editor.classList.remove('hidden');
  emptyHint.classList.add('hidden');

  inputs.title.value = block.title;
  inputs.content.value = block.content;
  inputs.width.value = block.width;
  inputs.height.value = block.height;
  inputs.textColor.value = block.textColor;
  inputs.bgColor.value = block.bgColor;
  inputs.details.value = block.details;
}

function attachEditorEvents() {
  Object.entries(inputs).forEach(([key, input]) => {
    input.addEventListener('input', () => {
      const block = getSelectedBlock();
      if (!block) return;

      if (key === 'width' || key === 'height') {
        block[key] = Math.max(40, Number(input.value) || 0);
      } else {
        block[key] = input.value;
      }
      render();
    });
  });
}

function openDetails(block) {
  document.getElementById('dialogTitle').textContent = block.title;
  document.getElementById('dialogContent').textContent = block.content;
  document.getElementById('dialogDetails').textContent = block.details || '暂无详细信息';
  detailDialog.showModal();
}

function escapeHtml(v) {
  return v
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

addBlockBtn.addEventListener('click', () => {
  const block = createBlock();
  state.blocks.unshift(block);
  state.selectedId = block.id;
  syncEditor();
  render();
});

deleteBlockBtn.addEventListener('click', () => {
  if (!state.selectedId) return;
  state.blocks = state.blocks.filter((x) => x.id !== state.selectedId);
  state.selectedId = state.blocks[0]?.id ?? null;
  syncEditor();
  render();
});

state.blocks.push(createBlock());
state.selectedId = state.blocks[0].id;
attachEditorEvents();
syncEditor();
render();
