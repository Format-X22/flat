Аналитическая система для предсказания курса биткоина.
Работает на миксе из волн и их паттернов.

Чтобы оно заработало нужно поднять локально Postgres, создать в нем базу
с именем local. Туда будут выкачиваться свечи.
Далее необходимо установить NodeJS.
Это всё что нужно для работы.

Перед первым запуском нужно загрузить все nodejs-пакеты, для этого
в корне приложения нужно выполнить команду:

```bash
$ npm install
```
          
После для запуска нужно выполнить:

```bash
$ npm run start-bot
```

При первом запуске несколько минут будут выкачиваться свечи.
При повторном запуске выкачиваться будут только свежие свечи.

Файл .env.example не нужен, он остался от версии с автоматическим ботом.
Никакие переменные окружения не требуются.
В проекте осталось несколько апи-ключей, но все они давно отключены.
              
Аналитическая система умеет тестировать заданную стратегию на истории
и выводить результат. Результат можно получить в виде лога. Лог достаточно
информативен и выводит всё что происходит со сделками. Также
можно создать индикатор для TradingView, который отрисует все сделки
на графике. Файл с индикатором запищется в папку report. После в TradingView нужно
создать новый индикатор и скопировать исходный код из файла в TradingView.
Дополнительно можно получить отчет по прибылям в виде CSV. Файл будет лежать в папке
report.

В проекте имеется конфигурационный файл, находится в `apps/bot/src/bot.config.ts`

```
botMode: false, - не используется
printTrades: true, - выводить ли в консоль результаты симуляции
makeCsv: false, - сделать ли отчет в формате CSV.
makeTW: false, - создать ли индикатор для TradingView
load: true, - нужно ли загрузить свежие свечи
ticker: ETicker.BTCUSDT, - без доработок поддерживает только биткоин
risk: 33, - уровень риска (об этом будет ниже отдельно)
from: startOfYear(2019), - таймштамп в милисекундах откуда начать
to: endOfYear(2100), - таймштам в милисекундах где закончить
offset: 9, - на сколько часов сдвигать момент входа относительно UTC
```

Про offset - при указании 0 симулятор будет считать что ордера передвигаются
в полночь, в момент когда отрисовывается новая дневная свеча. Это 3 часа ночи
по Москве. Если указать 9, то это 12 по Москве (UTC+3 + 9 оффсет = 12).

Про risk - это размер капитала, который теряется в случае не успеха. Но при
этом чем он больше - тем больше прибыли на сделку. Соответственно при входе в
сделку нужно считать сумму входа по формуле: 

`((risk / percent) * amount) / bitcoin_price.`

percent - сколько процентов цены между входом и стопом
amount - размер торгового капитала в долларах

Допустим у вас 10_000 долларов, вы рискуете всегда на 15%, а цена биткоина 70_000.
Между ценой входа и стопом 2%.
Выходит ((15 / 2) * 10_000) / 70_000 = 1,071 биткоинов нужно поставить в сделку.
На Binance и Bybit при установке стопов и тейков отображает сколько будет потерь,
нужно убедится что там отображает около 15% в случае не удачи. Если всё
так - значит посчитано верно.

При установке ордера стоит ставить вход по индексу или маркировке,
стоп также по индексу или маркировке, а вот тейк по рыночной цене.
При этом вход нужно делать стоп-ордером - он означает что когда цена дойдет
до указанного триггера - будет выставлен ордер входа. Имеет смысл входить 
limit-ордером для защиты от резких движений, при этом зазор на вход в 0.25%,
то есть, например, к точке входа в 75_000 нужно добавить 187 баксов - 
в итоге триггер будет на 75_000 долларов за биткоин, а лимитный ордер на
75_187 баксов. Для шорта наоборот - вычитаем проценты. В итоге мы гарантируем вход,
но не дороже проскальзывания в 0.25%.

Из-за учета проскальзываний нужно добавлять ровно столько же к percent из формулы
выше - в итоге при 2% нужно делить не на 2, а на 2.15.

При запуске аналитика пишет в лог какие сейчас ордера в формате 

```
  "isActive": true, - активен ли ордер
  "side": "UP", - лонг или шорт
  "enter": 57051, - цена триггера входа
  "limit": 57137, - цена для лимитного ордера входа
  "take": 67069, - цена для тейка
  "stop": 54946, - цена для стопа
  "proportion": 3.94, - размер percent уже с учетом 0.25% на проскальзывание.
  "enterDate": "09-09-2024 03", - дата когда произошел вход, если произошел.
  "waitDays": 1 - количество дней ожидания (об этом ниже)
```

Про waitDays - при входе в сделку мы ждем указанное количество дней,
если оно становится равным 0 - нужно переставлять стоп на цену входа.
Это защищает нас от зависших сделок и наши потери, в случае неудачи,
становятся околонулевыми.

Детекторы сделок лежат в `apps/bot/src/analyzer/detector/detect`.
Все они могут конфигурироваться. Также нет разницы лонг это или шорт.
На график накладывается скользящее Хала (индикатор HullMa). Всего их 3.
После график режется на сегменты - восходящие и нисходящие линии скользящей.
Сегменты склеиваются в волны, по 2 сегмента на волну - одна восходящая,
одна нисходящая, либо наоборот. Детекторы получают нужное количество волн,
а потом строят от верха и низа уровни фибоначи, в конфигах каждого детектора
описаны на каких вход, стоп и тейк. В зависимости от детектора используется
множество фильтраций, всё в документации не описать, нужно читать код.
Для удобства отладки можно вызвать внутри
`if(this.debugHere(date_string, long/short)) { CODE }` и вывести в консоль
нужное для отладки. Почти все детекторы строят прогнозы для всех трех HullMa,
поэтому при дебаге можно отфильтровать нужное по `this.name === "UpMidDouble"`
Или другому интересующему имени. Паттерн имен - Up/Down + ''/Mid/Bid + Name.
'' - означает отсутствие, то есть UpDouble где Up - лонг, Double - имя детектора.

За дополнительными вопросами можно обратится в телеграмм-канал https://t.me/pavlovfinance