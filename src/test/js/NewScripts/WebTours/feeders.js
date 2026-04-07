/**
 * Пулы данных для сценария (аналог WebToursFeeder.scala в Gatling).
 *
 * --- Как в Gatling ---
 * Там не парсят файл руками: движок сам читает CSV из resources:
 *   val Users = csv("Users.csv").circular
 *   val City  = csv("City.csv").random
 * Потом .feed(Users) — и в сессии появляются ключи из заголовка (name, pass и т.д.).
 *
 * --- Как в k6 ---
 * Встроенного csv("...") как в Gatling нет. Обычный приём:
 *   1) open(...) один раз на старте (init) — прочитать текст файла;
 *   2) разобрать строки в массив объектов (наш parseUsers / parseCityColumn);
 *   3) обернуть в SharedArray — чтобы большой пул не копировался на каждого VU в памяти
 *      (по смыслу близко к тому, что Gatling держит фидер общим для нагрузки).
 *
 * Если пользователей мало и файл не нужен, можно было бы захардкодить:
 *   export const users = new SharedArray('u', () => [{ name: 'jojo', pass: 'bean' }]);
 * CSV оставляем — как у тебя в репо Gatling, удобно менять данные без кода.
 *
 * Пути open() — относительно этого .js файла (правила k6).
 */
import { SharedArray } from 'k6/data';

function parseUsers(text) {
  const lines = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const [name, pass] = line.split(',');
    out.push({ name: (name || '').trim(), pass: (pass || '').trim() });
  }
  return out;
}

function parseCityColumn(text) {
  const lines = text.trim().split(/\r?\n/);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const v = lines[i].trim();
    if (v) out.push(v);
  }
  return out;
}

export const users = new SharedArray('webtours_users', function () {
  return parseUsers(open('../../../resources/users.csv'));
});

export const cities = new SharedArray('webtours_cities', function () {
  return parseCityColumn(open('../../../resources/city.csv'));
});
