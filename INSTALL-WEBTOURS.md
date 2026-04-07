# WebTours на Windows

У тебя уже склонирован репозиторий с приложением в Docker:

`C:\Users\kalya\k6-webtours-demo\webtours-docker`

Источник: [github.com/pru-mike/webtours](https://github.com/pru-mike/webtours) — это тот же Mercury / HP Web Tours, что используют в LoadRunner / JMeter, упакованный в Apache + CGI.

## Вариант 1 — Docker (рекомендуется)

1. Запусти **Docker Desktop** и дождись, пока статус станет «Running».
2. В PowerShell:

```powershell
cd C:\Users\kalya\k6-webtours-demo\webtours-docker
docker compose up -d --build
```

3. Открой в браузере: [http://127.0.0.1:1080/WebTours/](http://127.0.0.1:1080/WebTours/) или [http://127.0.0.1:1080/WebTours/home.html](http://127.0.0.1:1080/WebTours/home.html).

### Вход jojo / bean

- Логин **строчными**: **jojo** и пароль **bean** (без пробела в поле пароля).
- Нажимай **Sign ON** на стартовой странице (нужна сессия с формы — не открывай только пустую вкладку без главной).
- Приложение в **фреймах**: если что-то не грузится, попробуй другой браузер или отключи блокировщики.
- Учётка лежит в каталоге хеша: `MTData/users/47/jojo` (число **47** считается от имени `jojo` в `login.pl`). Если файла нет в **47**, вход не сработает — после правок на диске пересобери образ: `docker compose up -d --build`.

4. Остановка:

```powershell
cd C:\Users\kalya\k6-webtours-demo\webtours-docker
docker compose down
```

В `docker-compose.yaml` порт **1080** проброшен на контейнер (как у классической установки HP).

**Если CGI отдаёт 500** (`welcome.pl` / `nav.pl`): после клонирования на Windows у `.pl` бывают окончания CRLF — в образе это снимается шагом `sed` в `Dockerfile` (у тебя уже добавлено). Пересобери: `docker compose build --no-cache`.

### k6 после Docker

Скрипты по умолчанию ждут `BASE_URL=http://127.0.0.1:1080` и префикс **`/WebTours`** для первого GET (см. `src/test/js/NewScripts/protocols.js`). Дополнительно ничего задавать не нужно.

Если когда-нибудь поставишь **официальный** WebTours с OpenText и путь будет `/webtours/`:

```powershell
k6 run -e WEBTOURS_PREFIX=/webtours src/test/js/simulation/Debug.js
```

## Вариант 2 — официальный установщик OpenText

1. Зайди на [Web Tours Sample Application](https://marketplace.opentext.com/appdelivery/content/web-tours-sample-application) (нужна учётная запись / принятие условий).
2. Скачай **WebTours.zip** и при необходимости **strawberry-perl** из того же релиза.
3. Установи Strawberry Perl, распакуй WebTours, запусти **StartServer** (как в readme пакета).
4. Тогда настрой `WEBTOURS_PREFIX` под реальный URL первой страницы (часто `/webtours/` на Windows).

---

*Образ в Docker собирается локально; первый `docker compose up --build` может занять несколько минут.*
