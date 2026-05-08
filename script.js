const state = {
  blocks: [],
  selectedId: null,
  currentEditor: '',
  columns: 2,
};

const canvas = document.getElementById('canvas');
const addBlockBtn = document.getElementById('addBlockBtn');
const deleteBlockBtn = document.getElementById('deleteBlockBtn');
const editor = document.getElementById('editor');
const emptyHint = document.getElementById('emptyHint');
const permissionHint = document.getElementById('permissionHint');
const detailDialog = document.getElementById('detailDialog');
const currentEditorInput = document.getElementById('currentEditorInput');
const columnsSelect = document.getElementById('columnsSelect');

const inputs = {
  owner: document.getElementById('ownerInput'),
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
  owner: state.currentEditor || '未指定',
  title: '新建模块',
  content: '点击右侧编辑内容',
  width: 220,
  height: 140,
  textColor: '#0f172a',
  bgColor: '#bfdbfe',
  details: '这里可以补充更详细的信息。',
});

function canEdit(block) {
  if (!block) return false;
  if (!block.owner || block.owner === '未指定') return true;
  return state.currentEditor.trim() === block.owner.trim();
}

function render() {
  canvas.innerHTML = '';
  canvas.style.setProperty('--columns', state.columns);

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
      <small>修改人：${escapeHtml(block.owner || '未指定')}（双击看详情）</small>
    `;

    el.addEventListener('click', () => {
      state.selectedId = block.id;
      syncEditor();
      render();
    });

    el.addEventListener('dblclick', () => openDetails(block));
    canvas.appendChild(el);
  });
}

function getSelectedBlock() {
  return state.blocks.find((x) => x.id === state.selectedId);
}

function setFormDisabled(disabled) {
  Object.values(inputs).forEach((input) => (input.disabled = disabled));
  deleteBlockBtn.disabled = disabled;
}

function syncEditor() {
  const block = getSelectedBlock();
  if (!block) {
    editor.classList.add('hidden');
    emptyHint.classList.remove('hidden');
    permissionHint.classList.add('hidden');
    return;
  }

  editor.classList.remove('hidden');
  emptyHint.classList.add('hidden');

  inputs.owner.value = block.owner;
  inputs.title.value = block.title;
  inputs.content.value = block.content;
  inputs.width.value = block.width;
  inputs.height.value = block.height;
  inputs.textColor.value = block.textColor;
  inputs.bgColor.value = block.bgColor;
  inputs.details.value = block.details;

  const editable = canEdit(block);
  setFormDisabled(!editable);
  permissionHint.classList.toggle('hidden', editable);
  permissionHint.textContent = editable
    ? ''
    : `当前块限定修改人为「${block.owner}」，你当前是「${state.currentEditor || '未填写'}」，仅可查看。`;
}

function attachEditorEvents() {
  Object.entries(inputs).forEach(([key, input]) => {
    input.addEventListener('input', () => {
      const block = getSelectedBlock();
      if (!block || !canEdit(block)) return;

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
  document.getElementById('dialogOwner').textContent = `限定修改人：${block.owner || '未指定'}`;
  document.getElementById('dialogDetails').textContent = block.details || '暂无详细信息';
  detailDialog.showModal();
}

function escapeHtml(v) {
  return String(v)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

currentEditorInput.addEventListener('input', () => {
  state.currentEditor = currentEditorInput.value.trim();
  syncEditor();
  render();
});

columnsSelect.addEventListener('change', () => {
  state.columns = Number(columnsSelect.value) || 2;
  render();
});

addBlockBtn.addEventListener('click', () => {
  const block = createBlock();
  state.blocks.unshift(block);
  state.selectedId = block.id;
  syncEditor();
  render();
});

deleteBlockBtn.addEventListener('click', () => {
  const block = getSelectedBlock();
  if (!block || !canEdit(block)) return;
  state.blocks = state.blocks.filter((x) => x.id !== state.selectedId);
  state.selectedId = state.blocks[0]?.id ?? null;
  syncEditor();
  render();
});

state.currentEditor = '张三';
currentEditorInput.value = state.currentEditor;
state.blocks.push(createBlock());
state.selectedId = state.blocks[0].id;
attachEditorEvents();
syncEditor();
render();
