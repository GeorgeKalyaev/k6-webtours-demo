/**
 * Точка входа Simulation (аналог Debug.scala): профиль нагрузки + default function.
 *
 * Из корня репозитория:
 *   k6 run src/test/js/simulation/Debug.js
 *
 * Профиль: всего 2 минуты, 4 ступени по 30 с.
 * Базовый профиль: FULL_ITER_PER_MIN итераций в минуту = 100%.
 * Старт с 100%; каждые 30 с +10 п.п. к базе (100% → 110% → 120% → 130%).
 * Интенсивность в ит/мин = база × (процент/100); при базе 10 это 10, 11, 12, 13.
 */
import { webToursFlow } from '../NewScripts/WebTours/scenario.js';

/** Сколько полных итераций сценария в минуту при «100%» нагрузки. */
const FULL_ITER_PER_MIN = 10;

/** Процент базового профиля на каждой ступени (4 × 30 с): 100%, затем +10 п.п. каждый шаг. */
const STAGE_PCTS = [100, 110, 120, 130];

const STAGE_SEC = 30;
const STAGE_COUNT = STAGE_PCTS.length;

function iterPerMin(percentOfFull) {
  return Math.max(1, Math.round((FULL_ITER_PER_MIN * percentOfFull) / 100));
}

function stepScenario(ratePerMin, startSec) {
  return {
    executor: 'constant-arrival-rate',
    rate: ratePerMin,
    timeUnit: '1m',
    duration: `${STAGE_SEC}s`,
    startTime: `${startSec}s`,
    preAllocatedVUs: 20,
    maxVUs: 80,
    gracefulStop: '5s',
  };
}

const scenarios = {};
for (let i = 0; i < STAGE_COUNT; i++) {
  const pct = STAGE_PCTS[i];
  const r = iterPerMin(pct);
  const start = i * STAGE_SEC;
  scenarios[`step${i + 1}_${pct}pct_${r}perMin`] = stepScenario(r, start);
}

export const options = {
  scenarios,
  thresholds: {
    http_req_failed: ['rate<=1'],
  },
};

export default function () {
  webToursFlow();
}
