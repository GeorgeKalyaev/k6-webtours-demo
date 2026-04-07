/**
 * Сценарий «купить билет» в WebTours.
 * group() = логическая транзакция (аналог Transaction Controller в JMeter):
 * в отчёте k6 появятся group_duration и тег group для всех запросов внутри.
 */
import { group, fail } from 'k6';
import { CityCount } from '../variables.js';
import { users, cities } from './feeders.js';
import * as wt from './http-actions.js';

function randInt(n) {
  return Math.floor(Math.random() * n);
}

function readUserSession(html) {
  if (!html) return null;
  const m =
    html.match(/name="userSession"\s+value="([^"]+)"/) ||
    html.match(/userSession"\s+value="([^"]+)"/);
  return m ? m[1] : null;
}

function pickRandomUser() {
  return users[randInt(users.length)];
}

function pickUniqueCities(count) {
  const picked = [];
  for (let i = 0; i < 500 && picked.length < count; i++) {
    const c = cities[randInt(cities.length)];
    if (!picked.includes(c)) picked.push(c);
  }
  return picked;
}

function fmtMMDDYYYY(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function encodeForm(pairs) {
  return pairs
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(v === undefined ? '' : String(v))}`,
    )
    .join('&');
}

export function webToursFlow() {
  const user = pickRandomUser();
  const session = {};

  group('TC01_start_session', () => {
    wt.getWebtoursRoot();
    wt.getSignOffTrue();
    const homeRes = wt.getHome();
    const userSession = readUserSession(homeRes.body);
    if (!userSession) {
      fail('no userSession — проверь WebTours и BASE_URL');
    }
    session.userSession = userSession;
  });

  group('TC02_login', () => {
    wt.postLogin(session.userSession, user.name, user.pass);
    wt.getMenuHome();
    wt.getIntro();
  });

  group('TC03_open_flight_booking', () => {
    wt.getPageSearch();
    wt.getMenuFlights();
    wt.getPageWelcome();
    const selected = pickUniqueCities(CityCount);
    if (selected.length < CityCount) {
      fail('not enough cities in feeder');
    }
    session.depart = selected[0];
    session.arrive = selected[1];
  });

  group('TC04_submit_flight_search', () => {
    const now = new Date();
    const d1 = new Date(now);
    d1.setDate(d1.getDate() + 1);
    const d2 = new Date(now);
    d2.setDate(d2.getDate() + 2);
    session.departDate = fmtMMDDYYYY(d1);
    session.returnDate = fmtMMDDYYYY(d2);

    const body = encodeForm([
      ['advanceDiscount', '0'],
      ['depart', session.depart],
      ['departDate', session.departDate],
      ['arrive', session.arrive],
      ['returnDate', session.returnDate],
      ['numPassengers', '1'],
      ['seatPref', 'Window'],
      ['seatType', 'Business'],
      ['findFlights.x', '56'],
      ['findFlights.y', '10'],
      ['.cgifields', 'roundtrip'],
      ['.cgifields', 'seatType'],
      ['.cgifields', 'seatPref'],
    ]);
    wt.postFindFlights(body);
  });

  group('TC05_select_outbound_flight', () => {
    const body = encodeForm([
      ['outboundFlight', `282;1975;${session.departDate}`],
      ['numPassengers', '1'],
      ['advanceDiscount', '0'],
      ['seatType', 'Business'],
      ['seatPref', 'Window'],
      ['reserveFlights.x', '39'],
      ['reserveFlights.y', '9'],
    ]);
    wt.postSelectOutboundFlight(body);
  });

  group('TC06_payment_and_confirm_purchase', () => {
    const body = encodeForm([
      ['firstName', 'Jojo'],
      ['lastName', 'Bean'],
      ['address1', 'pyshkin_street'],
      ['address2', 'Moscow_city'],
      ['pass1', 'Jojo Bean'],
      ['creditCard', '1234 4564 1236 2535'],
      ['expDate', '2028'],
      ['oldCCOption', ''],
      ['numPassengers', '1'],
      ['seatType', 'Business'],
      ['seatPref', 'Business'],
      ['outboundFlight', `282;1975;${session.departDate}`],
      ['advanceDiscount', '0'],
      ['returnFlight', ''],
      ['JSFormSubmit', 'off'],
      ['buyFlights.x', '23'],
      ['buyFlights.y', '6'],
      ['.cgifields.y', 'saveCC'],
    ]);
    wt.postPaymentAndBuy(body);
  });
}
