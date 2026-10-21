);
idsToLookup[30] = idsToLookup[1];
idsToLookup[90] = idsToLookup[4];

// Большое количество повторов, но порядок первого появления должен сохраниться
const codes = Array.from({ length: 8000 }, (_, index) => 'code-' + ((index * 17) % 700));
codes[5] = 'Ab-12';
codes[15] = 'ab-12';
codes[25] = 'Ab-12';

// В заказах встречаются и неизвестные статусы. Они не должны попадать в сводку известных статусов
const orders = Array.from({ length: 40000 }, (_, index) => ({
  id: index + 1,
  status: index % 101 === 0 ? 'returned' : STATUSES[index % STATUSES.length],
  amount: 100 + ((index * 13) % 900)
}));

// ЗАДАНИЕ 1. Найти только первый товар с нужным ID
function findProductByIdSlow(items, targetId) {
  return items.filter(item => item.id === targetId)[0];
}

function findProductByIdOptimised(items, targetId) {
  // find() останавливается на первом совпадении и не создаёт промежуточный массив.
  // Для отсутствующего ID возвращает undefined — как и исходный вариант.
  return items.find(item => item.id === targetId);
}

// ЗАДАНИЕ 2. Оставить товары, ID которых присутствует в списке ids
function filterSelectedProductsSlow(items, ids) {
  return items.filter(item => ids.includes(item.id));
}

function filterSelectedProductsOptimised(items, ids) {
  // Set даёт проверку наличия за O(1) в среднем вместо O(m) у includes().
  // Повторы в ids и отсутствующие ID на результат не влияют.
  const idSet = new Set(ids);
  return items.filter(item => idSet.has(item.id));
}

// ЗАДАНИЕ 3. Удалить повторяющиеся значения, сохранив порядок первого появления
function uniqueCodesSlow(values) {
  const result = [];
  for (const value of values) {
    if (!result.includes(value)) {
      result.push(value);
    }
  }
  return result;
}

function uniqueCodesOptimised(values) {
  // Set хранит уже встреченные значения и проверяет наличие за O(1).
  // Сравнение остаётся точным (регистрозависимым), как и в includes().
  const seen = new Set();
  const result = [];
  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }
  return result;
}

// ЗАДАНИЕ 4. Получить товары по массиву ID. ID могут повторяться или отсутствовать
function lookupProductsSlow(items, ids) {
  return ids.map(id => items.find(item => item.id === id));
}

function lookupProductsOptimised(items, ids) {
  // Строим Map id -> item один раз (O(n)), затем каждый запрос — O(1).
  // Сохраняем первый товар с данным id, как это делает find().
  const byId = new Map();
  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, item);
    }
  }
  // map() сохраняет порядок ids и повторяет товар для повторяющихся ID;
  // для отсутствующего ID get() вернёт undefined — как и find().
  return ids.map(id => byId.get(id));
}

// ЗАДАНИЕ 5. Для каждого известного статуса посчитать количество заказов и общую сумму amount
function countByStatusSlow(items) {
  return STATUSES.map(status => {
    const group = items.filter(item => item.status === status);
    return {
      status,
      count: group.length,
      totalAmount: group.reduce((sum, item) => sum + item.amount, 0)
    };
  });
}

function countByStatusOptimised(items) {
  // Инициализируем аккумуляторы для всех известных статусов
  const stats = new Map();
  for (const status of STATUSES) {
    stats.set(status, { count: 0, totalAmount: 0 });
  }

  // Один проход по заказам; неизвестные статусы просто игнорируются
  for (const order of items) {
    const acc = stats.get(order.status);
    if (acc) {
      acc.count += 1;
      acc.totalAmount += order.amount;
    }
  }

  // Сохраняем порядок STATUSES и структуру результата
  return STATUSES.map(status => {
    const acc = stats.get(status);
    return { status, count: acc.count, totalAmount: acc.totalAmount };
  });
}

// ЗАДАНИЕ 6. Найти самый дорогой товар, не изменяя исходный массив
function mostExpensiveProductSlow(items) {
  return items.slice().sort((a, b) => b.price - a.price)[0];
}

function mostExpensiveProductOptimised(items) {
  // Один проход без сортировки и без копирования массива.
  // При равенстве цен оставляем ранее встреченный товар (строгое >).
  let best = undefined;
  for (const item of items) {
    if (best === undefined || item.price > best.price) {
      best = item;
    }
  }
  return best;
}

// ЗАДАНИЕ 7. Для каждой категории посчитать количество, сумму, среднюю, минимальную и максимальную цену
function categorySummarySlow(items) {
  return CATEGORIES.map(category => {
    const group = items.filter(item => item.category === category);
    const totalPrice = group.reduce((sum, item) => sum + item.price, 0);
    const minPrice = group.reduce((min, item) => Math.min(min, item.price), Infinity);
    const maxPrice = group.reduce((max, item) => Math.max(max, item.price), -Infinity);

    return {
      category,
      count: group.length,
      totalPrice,
      averagePrice: group.length ? totalPrice / group.length : 0,
      minPrice: group.length ? minPrice : 0,
      maxPrice: group.length ? maxPrice : 0
    };
  });
}

function categorySummaryOptimised(items) {
  // Аккумуляторы по категориям; min/max инициализируем «пустыми» значениями
  const stats = new Map();
  for (const category of CATEGORIES) {
    stats.set(category, {
      count: 0,
      totalPrice: 0,
      minPrice: Infinity,
      maxPrice: -Infinity
    });
  }

  // Один проход по товарам
  for (const item of items) {
    const acc = stats.get(item.category);
    if (!acc) continue; // категории вне CATEGORIES игнорируем
    acc.count += 1;
    acc.totalPrice += item.price;
    if (item.price < acc.minPrice) acc.minPrice = item.price;
    if (item.price > acc.maxPrice) acc.maxPrice = item.price;
  }

  // Формируем результат в порядке CATEGORIES и с теми же полями
  return CATEGORIES.map(category => {
    const acc = stats.get(category);
    if (acc.count === 0) {
      return {
        category,
        count: 0,
        totalPrice: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0
      };
    }
    return {
      category,
      count: acc.count,
      totalPrice: acc.totalPrice,
      averagePrice: acc.totalPrice / acc.count,
      minPrice: acc.minPrice,
      maxPrice: acc.maxPrice
    };
  });
}

function deepEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

function assertSame(expected, actual, description) {
  if (!deepEqual(expected, actual)) {
    throw new Error('Результаты отличаются: ' + description);
  }
}

function median(numbers) {
  const sorted = numbers.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

function benchmark(fn, args, repetitions) {
  // Один прогревочный запуск серии
  for (let index = 0; index < repetitions; index++) fn(...args);

  const times = [];
  for (let round = 0; round < 5; round++) {
    const start = Date.now();
    for (let index = 0; index < repetitions; index++) {
      fn(...args);
    }
    const elapsed = Date.now() - start;
    times.push(elapsed / repetitions);
  }
  return { times, median: median(times) };
}

function compareTask(title, slowFn, optimisedFn, args, repetitions, edgeCases = []) {
  console.log('\n' + '='.repeat(66));
  console.log(title);

  const expected = slowFn(...args);
  const actual = optimisedFn(...args);
  assertSame(expected, actual, title);

  for (let index = 0; index < edgeCases.length; index++) {
    const caseArgs = edgeCases[index];
    assertSame(slowFn(...caseArgs), optimisedFn(...caseArgs), title + ', проверка ' + (index + 1));
  }
  console.log('Проверка результатов: OK (основной пример и дополнительные случаи: ' + edgeCases.length + ')');

  const slow = benchmark(slowFn, args, repetitions);
  const optimised = benchmark(optimisedFn, args, repetitions);
  console.log('Исходный вариант, замеры в мс на вызов: ' + slow.times.map(value => value.toFixed(3)).join(', '));
  console.log('Новый вариант, замеры в мс на вызов:     ' + optimised.times.map(value => value.toFixed(3)).join(', '));
  console.log('Медиана: исходный ' + slow.median.toFixed(3) + ' мс; новый ' + optimised.median.toFixed(3) + ' мс');

  if (optimised.median > 0) {
    const ratio = slow.median / optimised.median;
    console.log('Отношение времени исходного варианта к новому: ' + ratio.toFixed(2) + 'x');
  } else {
    console.log('Новый вариант слишком быстр для точного сравнения с текущей серией измерений.');
  }
}

console.log('JS-OPT: оптимизация обработки данных');
console.log('Для каждого задания сравниваются пять серий измерений; быстрые функции запускаются повторно в каждой серии.');

compareTask(
  '1. Поиск товара по ID',
  findProductByIdSlow,
  findProductByIdOptimised,
  [products, 2500],
  80,
  [[products, 1], [products, PRODUCT_COUNT], [products, PRODUCT_COUNT + 100]]
);

compareTask(
  '2. Фильтрация товаров по списку ID',
  filterSelectedProductsSlow,
  filterSelectedProductsOptimised,
  [products, selectedIds],
  2
);

compareTask(
  '3. Удаление повторяющихся кодов',
  uniqueCodesSlow,
  uniqueCodesOptimised,
  [codes],
  1
);

compareTask(
  '4. Многократный поиск товаров по ID',
  lookupProductsSlow,
  lookupProductsOptimised,
  [products, idsToLookup],
  1,
  [[products, [1, 1, PRODUCT_COUNT + 5, 500, 500]]]
);

compareTask(
  '5. Статистика заказов по статусам',
  countByStatusSlow,
  countByStatusOptimised,
  [orders],
  3
);

compareTask(
  '6. Поиск самого дорогого товара (дополнительно)',
  mostExpensiveProductSlow,
  mostExpensiveProductOptimised,
  [products],
  2
);

compareTask(
  '7. Сводка по категориям (дополнительно)',
  categorySummarySlow,
  categorySummaryOptimised,
  [products],
  2
);

console.log('\nВсе проверки завершены. Запишите медианы и объясните результат каждого выполненного задания');