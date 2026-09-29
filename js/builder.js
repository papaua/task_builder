(function () {
  const { types, getSavedTasks, saveTasks, escapeHtml } = window.TaskData;
  const typeList = document.querySelector('#type-list');
  const fields = document.querySelector('#type-fields');
  const form = document.querySelector('#task-form');
  const previewPanel = document.querySelector('#preview-panel');
  let currentType = 'single';
  let editing = false;

  types.forEach((type) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `type-option${type.id === currentType ? ' is-active' : ''}`;
    button.dataset.type = type.id;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(type.id === currentType));
    button.innerHTML = `<span>${type.marker}</span><b>${escapeHtml(type.label)}</b><i>↗</i>`;
    button.addEventListener('click', () => selectType(type.id));
    typeList.append(button);
  });

  function field(label, name, value = '', placeholder = '', multiline = false) {
    const control = multiline
      ? `<textarea data-name="${name}" rows="4" placeholder="${escapeHtml(placeholder)}" required>${escapeHtml(value)}</textarea>`
      : `<input data-name="${name}" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" required>`;
    return `<label class="field-label">${label}${control}</label>`;
  }

  function block(content, index, removable = true) {
    return `<div class="item-editor" data-item-index="${index}"><div class="item-editor-head"><span>ЭЛЕМЕНТ ${String(index + 1).padStart(2, '0')}</span>${removable ? '<button class="remove-item" type="button" aria-label="Удалить элемент">×</button>' : ''}</div><div class="item-fields">${content}</div></div>`;
  }

  function renderFields() {
    document.querySelector('#editor-type-title').textContent = types.find((type) => type.id === currentType).label;
    let html = '';
    if (currentType === 'single' || currentType === 'multiple') {
      const defaultOptions = currentType === 'single' ? 'push()\npop()\nshift()\nslice()' : 'String\nNumber\nBoolean\nHTML';
      const defaultAnswer = currentType === 'single' ? 'push()' : 'String|Number|Boolean';
      html = block(`${field('Вопрос', 'prompt', 'Какой метод добавляет элемент в массив?', 'Введите вопрос')}${field('Варианты ответов', 'options', defaultOptions, 'Каждый вариант с новой строки', true)}${field(currentType === 'single' ? 'Правильный ответ' : 'Правильные ответы (через |)', 'answer', defaultAnswer, 'Точное совпадение с вариантом')}`, 0, false);
    } else if (currentType === 'matching') {
      html = [block(`${field('Левая часть', 'left', 'HTML', 'Термин')}${field('Правая часть', 'right', 'Структура страницы', 'Определение')}`, 0, false), block(`${field('Левая часть', 'left', 'CSS', 'Термин')}${field('Правая часть', 'right', 'Оформление страницы', 'Определение')}`, 1)].join('');
    } else if (currentType === 'sequence') {
      html = [block(field('Этап', 'text', 'Анализ задачи', 'Пункт последовательности'), 0, false), block(field('Этап', 'text', 'Проектирование', 'Пункт последовательности'), 1), block(field('Этап', 'text', 'Разработка', 'Пункт последовательности'), 2)];
    } else if (currentType === 'categories' || currentType === 'sorting') {
      html = `<label class="field-label category-definitions">Категории (разделите запятыми)<input data-name="categories" value="${currentType === 'sorting' ? 'String, Number, Boolean' : 'Frontend, Backend'}" required></label>`;
      html += [block(`${field('Элемент', 'text', currentType === 'sorting' ? '"Hello"' : 'HTML', 'Термин или значение')}${field('Категория', 'category', currentType === 'sorting' ? 'String' : 'Frontend', 'Одна из категорий')}`, 0, false), block(`${field('Элемент', 'text', currentType === 'sorting' ? '25' : 'Node.js', 'Термин или значение')}${field('Категория', 'category', currentType === 'sorting' ? 'Number' : 'Backend', 'Одна из категорий')}`, 1)];
    } else if (currentType === 'fill') {
      html = block(`${field('Предложение (место пропуска — ____)', 'prompt', 'Для объявления переменной можно использовать ____.', 'Введите предложение')}${field('Допустимые ответы (через |)', 'answer', 'let|const|var', 'Например: let|const')}`, 0, false);
    } else if (currentType === 'error') {
      html = `<label class="field-label">Код (каждая строка отдельно)<textarea data-name="code" rows="5" required>const numbers = [1, 2, 3];\nnumbers.push(4);\nconsole.log(number);</textarea></label><div class="item-fields error-fields">${field('Номер ошибочной строки', 'errorLine', '3', 'Например, 2')}${field('Подсказка / объяснение', 'explanation', 'Используется number вместо numbers.', 'Объясните ошибку')}</div>`;
    }
    fields.innerHTML = html;
    fields.querySelectorAll('.remove-item').forEach((button) => button.addEventListener('click', () => { button.closest('.item-editor').remove(); renumberBlocks(); updatePreview(); }));
    fields.querySelectorAll('input, textarea').forEach((input) => input.addEventListener('input', updatePreview));
    document.querySelector('#add-item').hidden = currentType === 'error';
    updatePreview();
  }

  function selectType(type) {
    currentType = type;
    typeList.querySelectorAll('.type-option').forEach((button) => { const active = button.dataset.type === type; button.classList.toggle('is-active', active); button.setAttribute('aria-selected', String(active)); });
    renderFields();
  }

  function renumberBlocks() {
    fields.querySelectorAll('.item-editor').forEach((item, index) => { item.dataset.itemIndex = index; item.querySelector('.item-editor-head span').textContent = `ЭЛЕМЕНТ ${String(index + 1).padStart(2, '0')}`; });
  }

  function collectTask() {
    const value = (element, name) => element.querySelector(`[data-name="${name}"]`)?.value.trim() || '';
    const task = { id: `task-${Date.now()}`, title: document.querySelector('#task-title').value.trim(), type: currentType, difficulty: document.querySelector('#task-difficulty').value, instruction: document.querySelector('#task-instruction').value.trim() };
    const blocks = [...fields.querySelectorAll('.item-editor')];
    if (currentType === 'single' || currentType === 'multiple') {
      task.items = blocks.map((item) => ({ prompt: value(item, 'prompt'), options: value(item, 'options').split('\n').map((entry) => entry.trim()).filter(Boolean), answer: value(item, 'answer') }));
    } else if (currentType === 'matching') task.items = blocks.map((item) => ({ left: value(item, 'left'), right: value(item, 'right') }));
    else if (currentType === 'sequence') task.items = blocks.map((item) => ({ text: value(item, 'text') }));
    else if (currentType === 'categories' || currentType === 'sorting') { task.categories = value(fields, 'categories').split(',').map((entry) => entry.trim()).filter(Boolean); task.items = blocks.map((item) => ({ text: value(item, 'text'), category: value(item, 'category') })); }
    else if (currentType === 'fill') task.items = blocks.map((item) => ({ prompt: value(item, 'prompt'), answer: value(item, 'answer') }));
    else if (currentType === 'error') { task.code = value(fields, 'code'); task.errorLine = Number(value(fields, 'errorLine')); task.explanation = value(fields, 'explanation'); task.items = [{ text: 'Строки кода' }]; }
    return task;
  }

  function updatePreview() {
    const task = collectTask();
    if (!task?.title || !task.instruction || !task.items?.length) return;
    const host = document.querySelector('#preview-content');
    window.TaskChecker.renderTask(task, host, { interactive: false });
    document.querySelector('#editor-note').textContent = `${task.items.length} ${task.items.length === 1 ? 'элемент' : 'элементов'} · предпросмотр обновлён`;
    if (editing) window.TaskChecker.renderTask(task, host, { interactive: false });
  }

  document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => {
    editing = button.dataset.mode === 'edit';
    document.querySelectorAll('.mode-button').forEach((tab) => { const active = tab === button; tab.classList.toggle('is-active', active); tab.setAttribute('aria-selected', String(active)); });
    form.hidden = !editing;
    previewPanel.hidden = editing;
    if (!editing) updatePreview();
  }));

  document.querySelector('#add-item').addEventListener('click', () => {
    const current = collectTask();
    if (!current) return;
    const index = fields.querySelectorAll('.item-editor').length;
    let content = '';
    if (currentType === 'single' || currentType === 'multiple') content = `${field('Вопрос', 'prompt', '', 'Введите вопрос')}${field('Варианты ответов (каждый с новой строки)', 'options', '', 'Вариант 1\nВариант 2', true)}${field('Правильный ответ' + (currentType === 'multiple' ? 'ы (через |)' : ''), 'answer', '', 'Точное совпадение')}`;
    else if (currentType === 'matching') content = `${field('Левая часть', 'left', '', 'Термин')}${field('Правая часть', 'right', '', 'Определение')}`;
    else if (currentType === 'sequence') content = field('Этап', 'text', '', 'Пункт последовательности');
    else if (currentType === 'categories' || currentType === 'sorting') content = `${field('Элемент', 'text', '', 'Значение')}${field('Категория', 'category', '', 'Категория')}`;
    else if (currentType === 'fill') content = `${field('Предложение (пропуск — ____)', 'prompt', '', 'Введите предложение')}${field('Допустимые ответы (через |)', 'answer', '', 'Ответ')}`;
    else return;
    fields.insertAdjacentHTML('beforeend', block(content, index));
    fields.querySelector('.item-editor:last-child .remove-item').addEventListener('click', (event) => { event.currentTarget.closest('.item-editor').remove(); renumberBlocks(); updatePreview(); });
    fields.querySelectorAll('.item-editor:last-child input, .item-editor:last-child textarea').forEach((input) => input.addEventListener('input', updatePreview));
  });

  document.querySelector('#save-task').addEventListener('click', () => {
    if (!form.reportValidity()) return;
    const task = collectTask();
    const invalid = !task || !task.items.length || task.items.some((item) => Object.values(item).some((value) => value === '' || value === undefined)) || (['single', 'multiple'].includes(task.type) && task.items.some((item) => { const answers = item.answer.split('|').map((answer) => answer.trim()); return item.options.length < 2 || answers.some((answer) => !item.options.includes(answer)); })) || (['categories', 'sorting'].includes(task.type) && task.items.some((item) => !task.categories.includes(item.category))) || (task.type === 'error' && (!task.errorLine || task.errorLine > task.code.split('\n').length));
    if (invalid) { document.querySelector('#save-status').textContent = 'Проверьте поля и правильные ответы.'; return; }
    const saved = getSavedTasks();
    saved.unshift(task);
    saveTasks(saved);
    document.querySelector('#save-status').textContent = 'Задание сохранено';
    document.querySelector('#editor-note').textContent = 'Готово — задание появилось в библиотеке';
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
  });

  const menuToggle = document.querySelector('#menu-toggle');
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    document.querySelector('.main-nav').classList.toggle('menu-open', !isOpen);
  });

  renderFields();
})();