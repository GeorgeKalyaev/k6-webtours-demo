/**
 * Общие HTTP-настройки (аналог HttpSberMarket / httpProtocolWebTours в Gatling).
 * Прокси: $env:HTTP_PROXY / HTTPS_PROXY перед k6 run.
 */
export const BASE_URL = __ENV.BASE_URL || 'http://127.0.0.1:1080';

/**
 * Первый GET на корень демо. Docker pru-mike: /WebTours/. Классический HP: часто /webtours/
 * k6 run -e WEBTOURS_PREFIX=/webtours ...
 */
export const WEBTOURS_PREFIX = __ENV.WEBTOURS_PREFIX || '/WebTours';

export const htmlHeaders = {
  'Upgrade-Insecure-Requests': '1',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
};
