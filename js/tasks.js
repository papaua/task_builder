(function () {
  const types = [
    { id: 'single', label: 'Один правильный ответ', short: 'Тест', marker: '01' },
    { id: 'multiple', label: 'Несколько правильных ответов', short: 'Множественный выбор', marker: '02' },
    { id: 'matching', label: 'Сопоставление пар', short: 'Сопоставление', marker: '03' },
    { id: 'sequence', label: 'Установление последовательности', short: 'Последовательность', marker: '04' },
    { id: 'categories', label: 'Распределение по категориям', short: 'Распределение', marker: '05' },
    { id: 'fill', label: 'Заполнение пропусков', short: 'Заполнение пропусков', marker: '06' },
    { id: 'error', label: 'Найди ошибку', short: 'Найди ошибку', marker: '07' },
    { id: 'sorting', label: 'Интерактивная сортировка', short: 'Сортировка', marker: '08' }
  ];
  const seedTasks = [
    { id: 'sample-single', title: 'Массивы: базовые методы', type: 'single', difficulty: 'Легко', instruction: 'Какой метод добавляет элемент в конец массива?', items: [{ prompt: 'Какой метод добавляет элемент в конец массива JavaScript?', options: ['push()', 'pop()', 'shift()', 'slice()'], answer: 'push()' }] },
    { id: 'sample-multiple', title: 'Типы данных JavaScript', type: 'multiple', difficulty: 'Легко', instruction: 'Выберите все примитивные типы данных.', items: [{ prompt: 'Какие варианты являются типами данных JavaScript?', options: ['String', 'Number', 'Boolean', 'HTML'], answer: 'String|Number|Boolean' }] },
    { id: 'sample-matching', title: 'Языки и технологии', type: 'matching', difficulty: 'Средне', instruction: 'Соедините технологию с её назначением.', items: [{ left: 'HTML', right: 'Структура веб-страницы' }, { left: 'CSS', right: 'Оформление веб-страницы' }, { left: 'JavaScript', right: 'Интерактивность страницы' }, { left: 'SQL', right: 'Работа с данными' }] },
    { id: 'sample-sequence', title: 'Этапы разработки', type: 'sequence', difficulty: 'Средне', instruction: 'Расположите этапы разработки по правильному порядку.', items: [{ text: 'Анализ задачи' }, { text: 'Проектирование' }, { text: 'Разработка' }, { text: 'Тестирование' }, { text: 'Публикация' }] },
    { id: 'sample-categories', title: 'Клиент или сервер?', type: 'categories', difficulty: 'Средне', instruction: 'Распределите технологии по сторонам разработки.', categories: ['Frontend', 'Backend'], items: [{ text: 'HTML', category: 'Frontend' }, { text: 'CSS', category: 'Frontend' }, { text: 'JavaScript', category: 'Frontend' }, { text: 'Node.js', category: 'Backend' }, { text: 'PHP', category: 'Backend' }, { text: 'Express', category: 'Backend' }] },
    { id: 'sample-fill', title: 'Переменные в JavaScript', type: 'fill', difficulty: 'Легко', instruction: 'Введите подходящее ключевое слово.', items: [{ prompt: 'Для объявления переменной можно использовать ключевое слово ____.', answer: 'let|const|var' }] },
    { id: 'sample-error', title: 'Найди ошибку в коде', type: 'error', difficulty: 'Сложно', instruction: 'Нажмите на строку, в которой допущена ошибка.', code: 'const numbers = [1, 2, 3];\nnumbers.push(4);\nconsole.log(number);', errorLine: 3, explanation: 'Опечатка в имени переменной: объявлен массив numbers, а выводится number.', items: [{ text: 'Строки кода' }] },
    { id: 'sample-sorting', title: 'Определи тип значения', type: 'sorting', difficulty: 'Легко', instruction: 'Распределите значения по типам JavaScript.', categories: ['String', 'Number', 'Boolean'], items: [{ text: '"Hello"', category: 'String' }, { text: '25', category: 'Number' }, { text: 'true', category: 'Boolean' }, { text: '"2026"', category: 'String' }, { text: 'false', category: 'Boolean' }, { text: '3.14', category: 'Number' }] }
  ];
  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) { const randomIndex = Math.floor(Math.random() * (index + 1)); [result[index], result[randomIndex]] = [result[randomIndex], result[index]]; }
    return result;
  }
  function getSavedTasks() { try { const stored = JSON.parse(localStorage.getItem('itb-tasks') || '[]'); return Array.isArray(stored) ? stored : []; } catch (error) { return []; } }
  function saveTasks(tasks) { localStorage.setItem('itb-tasks', JSON.stringify(tasks)); }
  function escapeHtml(value) { return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
  window.TaskData = { types, seedTasks, shuffle, getSavedTasks, saveTasks, escapeHtml };
})();