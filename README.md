# k6 WebTours demo

Учебный проект в пару к Gatling: модульные скрипты **k6** под демо **WebTours**, Docker-образ приложения и заметки по установке.

| Репозиторий | Ссылка |
|-------------|--------|
| **k6 (этот репозиторий)** | [github.com/GeorgeKalyaev/k6-webtours-demo](https://github.com/GeorgeKalyaev/k6-webtours-demo) |
| **Gatling, та же идея структуры** | [github.com/GeorgeKalyaev/gatling-webtours-demo](https://github.com/GeorgeKalyaev/gatling-webtours-demo) |

Локально рядом можно клонировать оба репозитория в одну папку (например `..\gat` и текущий каталог).

## Структура (как в Gatling)

```text
src/test/
├── resources/                    ← данные (как CSV в Gatling)
│   ├── users.csv
│   └── city.csv
└── js/
    ├── simulation/
    │   └── Debug.js              ← точка входа k6 (как Debug.scala)
    └── NewScripts/
        ├── protocols.js          ← BASE_URL, заголовки (как httpProtocol)
        ├── variables.js        ← CityCount (как VariablesOfCycles)
        └── WebTours/
            ├── feeders.js        ← WebToursFeeder
            ├── http-actions.js   ← WebToursAction
            └── scenario.js       ← WebToursCommonScenario
```

| Путь (корень репо) | Назначение |
|--------------------|------------|
| `src/test/js/simulation/Debug.js` | `k6 run …` — профиль нагрузки + default |
| `src/test/js/NewScripts/WebTours/` | сценарий WebTours: **group(`TC…`)** = транзакция как Transaction Controller в JMeter |
| `webtours-docker/` | Docker WebTours, порт **1080** |
| `INSTALL-WEBTOURS.md` | установка, вход **jojo** / **bean** |
| `start-webtours-docker.ps1` | запуск контейнера |
| `scripts/run-k6-influxdb1.ps1` | запуск k6 с выводом в InfluxDB 1.x |
| `test.js`, `step_load.js` | короткие примеры k6 |

## Быстрый старт

1. [Установи k6](https://k6.io/docs/get-started/installation/) (например `C:\k6\k6.exe`).
2. Подними WebTours: `INSTALL-WEBTOURS.md` или `.\start-webtours-docker.ps1`.
3. Запуск (обязательно **из корня репозитория**):

```powershell
cd C:\Users\kalya\k6-webtours-demo
k6 run src/test/js/simulation/Debug.js
```

Дополнительно: `k6 run -e WEBTOURS_PREFIX=/webtours src/test/js/simulation/Debug.js`

В консоли k6 после прогона смотри метрики **`group_duration`** и тег **`group`** у HTTP-запросов — это время и принадлежность к транзакции `TC01_…` … `TC06_…`.

## InfluxDB 1.x и Grafana (без xk6)

Для **InfluxDB 1.0** обычный k6 с [официального установщика](https://grafana.com/docs/k6/latest/set-up/install-k6/) уже умеет слать метрики — **отдельно ничего скачивать не нужно**.

### Что такое xk6 (и зачем он вам не нужен для Influx 1)

**xk6** — это инструмент на Go (`go install go.k6.io/xk6/cmd/xk6@latest`), который **собирает свой бинарник k6** из исходников и **подключает расширения** (другие хранилища, протоколы и т.д.). Это не «патч к Influx 1»: для **InfluxDB 1.x** расширение не требуется. **xk6 + xk6-output-influxdb** нужны в основном для **InfluxDB 2.x** (org, bucket, token), где встроенного output в стандартном k6 нет.

### Куда настраивать поток метрик

Настройка **на стороне k6 при запуске**: флаг **`--out influxdb=…`**. Grafana только подключается к Influx как **Data source** и рисует дашборд.

Пример вручную (из корня репозитория):

```powershell
k6 run --out influxdb=http://localhost:8086/k6 src/test/js/simulation/Debug.js
```

Если в Influx включена авторизация, часто задают URL вида `http://USER:PASSWORD@localhost:8086/k6` (осторожно с спецсимволами в пароле — их нужно URL-кодировать).

Готовый дашборд под классическую схему метрик k6 + Influx 1 (InfluxQL): [Grafana — k6 Load Testing Results, ID **2587**](https://grafana.com/grafana/dashboards/2587). В Grafana: **Connections → Data sources → InfluxDB** (режим совместимый с Influx 1 / InfluxQL), затем **Dashboards → Import** по ID.

Ещё варианты под Influx 1.x на [Grafana Labs](https://grafana.com/grafana/dashboards/): **24708**, **14801**, **19630** (импорт по ID, привязка к вашему datasource). Дашборды под **InfluxDB 2 / Flux** (например **19431**) сюда не входят.

Если после импорта старых JSON панели ругаются на **`Datasource ${DS_K6}`** (или другой `${DS_…}`): в **Dashboard settings → Variables** или в каждой панели укажите ваш InfluxDB datasource. Ошибка **Invalid interval string** из‑за **`>1s`**: в настройках панели/запроса замените минимальный интервал на **`1s`** (без символа `>`).

### Скрипт в этом репозитории

```powershell
cd C:\Users\kalya\k6-webtours-demo
.\scripts\run-k6-influxdb1.ps1
.\scripts\run-k6-influxdb1.ps1 -InfluxOut "http://localhost:8086/myk6db" -Tag "run-2026-04-07"
```

Опциональный `-Tag` добавляет тег `testid=…` ко всем метрикам — удобно отделять прогоны в запросах Grafana.

## GitLab CI/CD (как это выглядит)

В корне лежит **`.gitlab-ci.yml`** — описание пайплайна: этап **`verify`**, две джобы (**`k6:inspect`**, **`smoke:shell`**). Они не гоняют полный прогон против WebTours, только проверяют окружение и что **`k6 inspect`** принимает `Debug.js`.

**Проще всего увидеть пайплайн:** создать проект на [GitLab.com](https://gitlab.com), включить **shared runners**, запушить этот репозиторий — в **Build → Pipelines** появятся зелёные/красные прогоны.

Полноценный **свой GitLab** (не только runner) обычно поднимают в **Docker** образом `gitlab/gitlab-ce` или в Kubernetes; на домашнем ПК нужно много RAM и терпение при первом старте. Для учёбы достаточно **GitLab.com + `.gitlab-ci.yml`**.

## Клонирование

```powershell
git clone https://github.com/GeorgeKalyaev/k6-webtours-demo.git
cd k6-webtours-demo
```

---

Папка `k6Test` (если была старая копия) не относится к этому репозиторию — актуальная раскладка только здесь.
