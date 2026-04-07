/**
 * HTTP-шаги WebTours (только запросы, без проверок).
 * Ниже блоки сгруппированы по смыслу — как в сценарии покупки билета.
 */
import http from 'k6/http';
import { BASE_URL, htmlHeaders, WEBTOURS_PREFIX } from '../protocols.js';

const get = (name) => ({
  headers: htmlHeaders,
  tags: { name },
});

const postForm = (name) => ({
  headers: {
    ...htmlHeaders,
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  tags: { name },
});

// -----------------------------------------------------------------------------
// Старт сессии: заход на сайт, сброс сессии, главная с формой (нужен userSession)
// -----------------------------------------------------------------------------
export function getWebtoursRoot() {
  return http.get(`${BASE_URL}${WEBTOURS_PREFIX}/`, get('root'));
}

export function getSignOffTrue() {
  return http.get(`${BASE_URL}/cgi-bin/welcome.pl?signOff=true`, get('sign_off'));
}

export function getHome() {
  return http.get(`${BASE_URL}/cgi-bin/nav.pl?in=home`, get('nav_home'));
}

// -----------------------------------------------------------------------------
// Вход под пользователем (логин + кадры меню / приветствие)
// -----------------------------------------------------------------------------
export function postLogin(userSession, username, password) {
  return http.post(
    `${BASE_URL}/cgi-bin/login.pl`,
    { userSession, username, password },
    postForm('login'),
  );
}

export function getMenuHome() {
  return http.get(
    `${BASE_URL}/cgi-bin/nav.pl?page=menu&in=home`,
    get('menu_home'),
  );
}

export function getIntro() {
  return http.get(
    `${BASE_URL}/cgi-bin/login.pl?intro=true`,
    get('intro'),
  );
}

// -----------------------------------------------------------------------------
// До поиска рейсов: страницы «заказать билет» → меню Flights → welcome брони
// -----------------------------------------------------------------------------
export function getPageSearch() {
  return http.get(
    `${BASE_URL}/cgi-bin/welcome.pl?page=search`,
    get('welcome_search'),
  );
}

export function getMenuFlights() {
  return http.get(
    `${BASE_URL}/cgi-bin/nav.pl?page=menu&in=flights`,
    get('menu_flights'),
  );
}

export function getPageWelcome() {
  return http.get(
    `${BASE_URL}/cgi-bin/reservations.pl?page=welcome`,
    get('reservations_welcome'),
  );
}

// -----------------------------------------------------------------------------
// Поиск рейсов: отправка формы (города, даты) — ещё не выбор конкретного билета
// -----------------------------------------------------------------------------
export function postFindFlights(formBody) {
  return http.post(
    `${BASE_URL}/cgi-bin/reservations.pl`,
    formBody,
    postForm('find_flights'),
  );
}

// -----------------------------------------------------------------------------
// Выбор билета: фиксация outbound-рейса (конкретный flight из выдачи)
// -----------------------------------------------------------------------------
export function postSelectOutboundFlight(formBody) {
  return http.post(
    `${BASE_URL}/cgi-bin/reservations.pl`,
    formBody,
    postForm('select_outbound'),
  );
}

// -----------------------------------------------------------------------------
// Покупка: пассажир, карта, подтверждение (buy) — всё относится к оплате/покупке
// -----------------------------------------------------------------------------
export function postPaymentAndBuy(formBody) {
  return http.post(
    `${BASE_URL}/cgi-bin/reservations.pl`,
    formBody,
    postForm('payment_buy'),
  );
}
