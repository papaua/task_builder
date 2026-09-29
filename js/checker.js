(function () {
  const { escapeHtml, shuffle } = window.TaskData;
  function renderTask(task, container, options = {}) {
    const interactive = options.interactive !== false;
    let body = '';
    if (task.type === 'error') {
      const lines = String(task.code || '').split('\n');
      body = `<div class="error-code">${lines.map((line, index) => `<button class="code-line" type="button" data-error-line="${index + 1}" ${interactive ? '' : 'disabled'}><span>${String(index + 1).padStart(2, '0')}</span><code>${escapeHtml(line) || '&nbsp;'}</code></button>`).join('')}</div>`;
    } else if (task.type === 'matching') {
      const rights = shuffle(task.items.map((item) => item.right));
      body = `<div class="match-list">${task.items.map((item, index) => `<label class="match-row"><span class="match-left">${escapeHtml(item.left)}</span><span class="match-connector"></span><select data-match="${index}" ${interactive ? '' : 'disabled'}><option value="">Выберите пару</option>${rights.map((right) => `<option value="${escapeHtml(right)}">${escapeHtml(right)}</option>`).join('')}</select></label>`).join('')}</div>`;
    } else if (task.type === 'sequence') {
      body = `<ol class="sequence-list" data-sortable>${shuffle(task.items).map((item) => `<li class="sequence-item" draggable="${interactive}" data-sequence-value="${escapeHtml(item.text)}"><span class="drag-handle" aria-hidden="true">⠿</span><span>${escapeHtml(item.text)}</span></li>`).join('')}</ol>`;
    } else if (task.type === 'categories' || task.type === 'sorting') {
      body = `<div class="sort-items">${shuffle(task.items).map((item) => `<label class="sort-row"><span>${escapeHtml(item.text)}</span><select data-category-item="${escapeHtml(item.text)}" ${interactive ? '' : 'disabled'}><option value="">Выберите категорию</option>${task.categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('')}</select></label>`).join('')}</div>`;
    } else {
      const multiple = task.type === 'multiple';
      body = `<div class="question-list">${task.items.map((item, itemIndex) => {
        const optionsList = shuffle(item.options || []);
        const choices = optionsList.map((option) => `<label class="answer-option"><input type="${multiple ? 'checkbox' : 'radio'}" name="answer-${itemIndex}" value="${escapeHtml(option)}" ${interactive ? '' : 'disabled'}><span>${escapeHtml(option)}</span></label>`).join('');
        const prompt = task.type === 'fill' ? escapeHtml(item.prompt).replace(/____/g, '<span class="blank-line">&nbsp;</span>') : escapeHtml(item.prompt);
        return `<article class="question-block" data-question="${itemIndex}"><h3>${prompt}</h3>${task.type === 'fill' ? `<input class="fill-input" type="text" data-fill="${itemIndex}" placeholder="Ваш ответ" ${interactive ? '' : 'disabled'}>` : `<div class="answer-options">${choices}</div>`}</article>`;
      }).join('')}</div>`;
    }
    const count = task.type === 'error' ? String(task.code || '').split('\n').length : task.items.length;
    container.innerHTML = `<section class="exercise"><div class="exercise-meta"><span class="type-chip">${escapeHtml(window.TaskData.types.find((type) => type.id === task.type)?.short || 'Задание')}</span><span>${count} ${count === 1 ? 'элемент' : 'элементов'}</span></div><h2 class="exercise-title">${escapeHtml(task.title || 'Новое задание')}</h2><p class="exercise-instruction">${escapeHtml(task.instruction || 'Выполните задание.')}</p>${body}${interactive ? '<button class="button button-dark check-button" type="button">Проверить ответы <span aria-hidden="true">↗</span></button>' : ''}<div class="result-panel" aria-live="polite" hidden></div></section>`;
    if (interactive) bindInteractions(container);
  }
  function bindInteractions(container) {
    let dragged = null;
    container.querySelectorAll('.sequence-item').forEach((item) => {
      item.addEventListener('dragstart', () => { dragged = item; item.classList.add('is-dragging'); });
      item.addEventListener('dragend', () => { item.classList.remove('is-dragging'); dragged = null; });
      item.addEventListener('dragover', (event) => { event.preventDefault(); if (dragged && dragged !== item) { const bounds = item.getBoundingClientRect(); item.parentNode.insertBefore(dragged, event.clientY < bounds.top + bounds.height / 2 ? item : item.nextSibling); } });
    });
    container.querySelectorAll('.code-line').forEach((line) => line.addEventListener('click', () => { container.querySelectorAll('.code-line.is-picked').forEach((picked) => picked.classList.remove('is-picked')); line.classList.add('is-picked'); }));
  }
  function checkTask(task, container) {
    const items = task.items || [];
    let correctCount = 0;
    const mark = (element, isCorrect) => { if (element) { element.classList.toggle('is-correct', isCorrect); element.classList.toggle('is-incorrect', !isCorrect); } };
    if (task.type === 'error') {
      const selected = Number(container.querySelector('.code-line.is-picked')?.dataset.errorLine || 0);
      correctCount = Number(selected === Number(task.errorLine));
      container.querySelectorAll('.code-line').forEach((line) => mark(line, Number(line.dataset.errorLine) === Number(task.errorLine)));
    } else if (task.type === 'matching') {
      items.forEach((item, index) => { const select = container.querySelector(`[data-match="${index}"]`); const isCorrect = select.value === item.right; correctCount += Number(isCorrect); mark(select.closest('.match-row'), isCorrect); });
    } else if (task.type === 'sequence') {
      [...container.querySelectorAll('.sequence-item')].forEach((element, index) => { const isCorrect = element.dataset.sequenceValue === items[index]?.text; correctCount += Number(isCorrect); mark(element, isCorrect); });
    } else if (task.type === 'categories' || task.type === 'sorting') {
      items.forEach((item) => { const select = [...container.querySelectorAll('[data-category-item]')].find((input) => input.dataset.categoryItem === item.text); const isCorrect = select?.value === item.category; correctCount += Number(isCorrect); mark(select?.closest('.sort-row'), isCorrect); });
    } else if (task.type === 'fill') {
      items.forEach((item, index) => { const input = container.querySelector(`[data-fill="${index}"]`); const accepted = item.answer.split('|').map((answer) => answer.trim().toLocaleLowerCase('ru')); const isCorrect = accepted.includes(input.value.trim().toLocaleLowerCase('ru')); correctCount += Number(isCorrect); mark(input, isCorrect); });
    } else {
      items.forEach((item, index) => { const selected = [...container.querySelectorAll(`[name="answer-${index}"]:checked`)].map((input) => input.value).sort(); const expected = item.answer.split('|').map((answer) => answer.trim()).sort(); const isCorrect = selected.length === expected.length && selected.every((answer, answerIndex) => answer === expected[answerIndex]); correctCount += Number(isCorrect); mark(container.querySelector(`[data-question="${index}"]`), isCorrect); });
    }
    const total = task.type === 'error' ? 1 : items.length;
    const mistakes = total - correctCount;
    const percent = total ? Math.round((correctCount / total) * 100) : 0;
    const feedback = task.type === 'error' ? task.explanation : mistakes ? 'Посмотрите на отмеченные ответы и попробуйте ещё раз.' : 'Отличная работа, всё верно!';
    const result = container.querySelector('.result-panel');
    result.hidden = false;
    result.innerHTML = `<div class="result-score"><strong>${percent}%</strong><span>Ваш результат</span></div><div class="result-detail"><b>Правильно: ${correctCount}</b><b>Ошибки: ${mistakes}</b><p>${escapeHtml(feedback || '')}</p></div><div class="progress-track"><span style="width:${percent}%"></span></div>`;
    if (percent >= 80) { const burst = document.createElement('span'); burst.className = 'celebration'; burst.textContent = '✳  ✦  ✳'; result.append(burst); setTimeout(() => burst.remove(), 1500); }
    return { correctCount, mistakes, percent };
  }
  window.TaskChecker = { renderTask, checkTask };
})();