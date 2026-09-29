(function () {
  const { types, seedTasks, getSavedTasks, shuffle, escapeHtml } = window.TaskData;
  const grid = document.querySelector('#task-grid');
  const search = document.querySelector('#search-input');
  const typeFilter = document.querySelector('#type-filter');
  const difficultyFilter = document.querySelector('#difficulty-filter');
  const catalog = document.querySelector('.catalog-section');
  const playSection = document.querySelector('#play-section');
  const playContent = document.querySelector('#play-content');
  const tasks = [...getSavedTasks(), ...seedTasks];
  let session = [];
  let sessionIndex = 0;
  let points = 0;

  types.forEach((type) => typeFilter.append(new Option(type.short, type.id)));

  function itemCount(task) {
    return task.type === 'error' ? String(task.code || '').split('\n').length : task.items.length;
  }

  function renderCards() {
    const query = search.value.trim().toLocaleLowerCase('ru');
    const filtered = tasks.filter((task) => task.title.toLocaleLowerCase('ru').includes(query)
      && (typeFilter.value === 'all' || typeFilter.value === task.type)
      && (difficultyFilter.value === 'all' || difficultyFilter.value === task.difficulty));
    grid.innerHTML = '';
    filtered.forEach((task, index) => {
      const type = types.find((entry) => entry.id === task.type);
      const card = document.createElement('article');
      card.className = 'task-card';
      card.style.setProperty('--card-index', index);
      card.innerHTML = `<div class="card-top"><span class="card-marker">${type.marker}</span><span class="difficulty difficulty-${task.difficulty.toLowerCase()}">${escapeHtml(task.difficulty)}</span></div><div class="card-body"><p class="card-type">${escapeHtml(type.short)}</p><h3>${escapeHtml(task.title)}</h3><p class="card-description">${escapeHtml(task.instruction)}</p></div><div class="card-bottom"><span>${String(itemCount(task)).padStart(2, '0')} ${task.type === 'error' ? 'строки' : 'элементов'}</span><button class="card-start" type="button" aria-label="Начать: ${escapeHtml(task.title)}">Начать <span aria-hidden="true">↗</span></button></div>`;
      card.querySelector('.card-start').addEventListener('click', () => startSession([task]));
      grid.append(card);
    });
    document.querySelector('#catalog-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'задание' : 'заданий'}`;
    document.querySelector('#empty-state').hidden = filtered.length !== 0;
  }

  function startSession(selected) {
    session = selected;
    sessionIndex = 0;
    points = 0;
    catalog.hidden = true;
    playSection.hidden = false;
    playSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderExercise();
  }

  function renderExercise() {
    const task = session[sessionIndex];
    document.querySelector('#play-counter').textContent = `${String(sessionIndex + 1).padStart(2, '0')} / ${String(session.length).padStart(2, '0')}`;
    window.TaskChecker.renderTask(task, playContent);
    playContent.querySelector('.check-button').addEventListener('click', (event) => {
      const result = window.TaskChecker.checkTask(task, playContent);
      points += result.correctCount;
      event.currentTarget.remove();
      if (sessionIndex + 1 < session.length) {
        const next = document.createElement('button');
        next.className = 'button button-lime next-task';
        next.type = 'button';
        next.textContent = 'Следующее задание →';
        next.addEventListener('click', () => { sessionIndex += 1; renderExercise(); });
        playContent.querySelector('.exercise').append(next);
      } else if (session.length > 1) {
        const finish = document.createElement('button');
        finish.className = 'button button-lime next-task';
        finish.type = 'button';
        finish.textContent = 'Завершить микс →';
        finish.addEventListener('click', renderSessionResult);
        playContent.querySelector('.exercise').append(finish);
      }
    });
  }

  function renderSessionResult() {
    const total = session.reduce((sum, task) => sum + (task.type === 'error' ? 1 : task.items.length), 0);
    const percent = total ? Math.round(points / total * 100) : 0;
    playContent.innerHTML = `<div class="session-result"><span class="eyebrow">МИКС ЗАВЕРШЁН</span><strong>${percent}%</strong><h2>${percent >= 80 ? 'Отличная работа!' : 'Хорошее начало.'}</h2><p>Верно выполнено ${points} из ${total} элементов.</p><button class="button button-dark" id="session-again">Пройти ещё раз</button></div>`;
    playContent.querySelector('#session-again').addEventListener('click', () => startSession(shuffle(session)));
  }

  search.addEventListener('input', renderCards);
  typeFilter.addEventListener('change', renderCards);
  difficultyFilter.addEventListener('change', renderCards);
  const menuToggle = document.querySelector('#menu-toggle');
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Открыть меню' : 'Закрыть меню');
    document.querySelector('.main-nav').classList.toggle('menu-open', !isOpen);
  });
  document.querySelector('#mix-button').addEventListener('click', () => {
    const onePerType = types.map((type) => shuffle(tasks.filter((task) => task.type === type.id))[0]).filter(Boolean);
    startSession(shuffle(onePerType).slice(0, Math.min(4, onePerType.length)));
  });
  document.querySelector('#back-to-catalog').addEventListener('click', () => { playSection.hidden = true; catalog.hidden = false; });
  renderCards();
})();