import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    step_1: {
      executor: 'constant-arrival-rate',
      exec: 'getTest',
      rate: 15,
      timeUnit: '30s',
      duration: '30s',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    step_2: {
      executor: 'constant-arrival-rate',
      exec: 'getTest',
      rate: 30,
      timeUnit: '30s',
      duration: '30s',
      startTime: '30s',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    step_3: {
      executor: 'constant-arrival-rate',
      exec: 'getTest',
      rate: 45,
      timeUnit: '30s',
      duration: '30s',
      startTime: '60s',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
    step_4: {
      executor: 'constant-arrival-rate',
      exec: 'getTest',
      rate: 60,
      timeUnit: '30s',
      duration: '30s',
      startTime: '90s',
      preAllocatedVUs: 5,
      maxVUs: 20,
    },
  },

  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export function getTest() {
  const res = http.get('https://test.k6.io');

  check(res, {
    'status is 200': (r) => r.status === 200,
  });
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data, null, 2),
    stdout: 'Тест завершен. Файл summary.json сохранен.\n',
  };
}