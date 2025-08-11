const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config({ path: './config.env' });

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 Добро пожаловать! Я бот с интеграцией внешних API.

📋 Доступные команды:
/start - Начать работу с ботом
/help - Показать справку
/weather [город] - Реальная погода через OpenWeatherMap
/news - Последние новости
/currency [код] - Курс валют
/translate [текст] - Перевод через Google Translate
/gif [запрос] - Поиск GIF через Giphy
/wiki [запрос] - Поиск в Wikipedia

💡 Для работы некоторых функций нужны API ключи!
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 Справка по командам с API интеграцией:

🔹 Погода:
/weather [город] - Получить реальную погоду
Пример: /weather Москва

🔹 Новости:
/news - Последние новости (заглушка)

🔹 Валюты:
/currency [код] - Курс валюты
Пример: /currency USD

🔹 Перевод:
/translate [текст] - Переводчик (заглушка)

🔹 GIF:
/gif [запрос] - Поиск GIF (заглушка)

🔹 Wikipedia:
/wiki [запрос] - Поиск в Wikipedia (заглушка)

⚠️ Для реальной работы нужны API ключи!
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Функция для получения погоды через OpenWeatherMap API
async function getWeather(city) {
  try {
    // Вам нужно получить API ключ на https://openweathermap.org/api
    const apiKey = process.env.OPENWEATHER_API_KEY || 'your_api_key_here';
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=ru`
    );
    
    const weather = response.data;
    return {
      city: weather.name,
      temperature: Math.round(weather.main.temp),
      feels_like: Math.round(weather.main.feels_like),
      humidity: weather.main.humidity,
      description: weather.weather[0].description,
      wind_speed: Math.round(weather.wind.speed * 3.6), // м/с в км/ч
      icon: weather.weather[0].icon
    };
  } catch (error) {
    console.error('Ошибка получения погоды:', error.message);
    return null;
  }
}

// Обработчик команды /weather
bot.onText(/\/weather(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const city = match[1] || 'Москва';
  
  // Показываем "печатает" индикатор
  bot.sendChatAction(chatId, 'typing');
  
  const weather = await getWeather(city);
  
  if (weather) {
    const weatherMessage = `
🌤️ Погода в городе ${weather.city}:

🌡️ Температура: ${weather.temperature}°C
🌡️ Ощущается как: ${weather.feels_like}°C
💧 Влажность: ${weather.humidity}%
💨 Ветер: ${weather.wind_speed} км/ч
☁️ ${weather.description}
    `;
    
    bot.sendMessage(chatId, weatherMessage);
  } else {
    bot.sendMessage(chatId, `❌ Не удалось получить погоду для города ${city}. Проверьте название города или API ключ.`);
  }
});

// Функция для получения курса валют
async function getCurrencyRate(currencyCode) {
  try {
    // Используем бесплатный API для курсов валют
    const response = await axios.get('https://api.exchangerate-api.com/v4/latest/USD');
    const rates = response.data.rates;
    
    if (rates[currencyCode]) {
      return {
        code: currencyCode,
        rate: rates[currencyCode],
        base: 'USD',
        date: response.data.date
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Ошибка получения курса валют:', error.message);
    return null;
  }
}

// Обработчик команды /currency
bot.onText(/\/currency(?: (.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const currencyCode = (match[1] || 'EUR').toUpperCase();
  
  bot.sendChatAction(chatId, 'typing');
  
  const currency = await getCurrencyRate(currencyCode);
  
  if (currency) {
    const currencyMessage = `
💱 Курс валюты:

💰 ${currency.code} к ${currency.base}
📊 1 ${currency.base} = ${currency.rate} ${currency.code}
📅 Дата: ${currency.date}
    `;
    
    bot.sendMessage(chatId, currencyMessage);
  } else {
    bot.sendMessage(chatId, `❌ Не удалось получить курс для валюты ${currencyCode}. Проверьте код валюты.`);
  }
});

// Обработчик команды /news (заглушка)
bot.onText(/\/news/, (msg) => {
  const chatId = msg.chat.id;
  const newsMessage = `
📰 Последние новости:

🔹 Технологии: ИИ развивается быстрыми темпами
🔹 Наука: Новые открытия в области квантовых вычислений
🔹 Программирование: Выпущена новая версия Node.js
🔹 Образование: Онлайн-курсы становятся популярнее

💡 Для получения реальных новостей нужен API ключ новостного сервиса!
  `;
  
  bot.sendMessage(chatId, newsMessage);
});

// Обработчик команды /translate (заглушка)
bot.onText(/\/translate (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  
  const translateMessage = `
🌐 Перевод:

📝 Оригинал: "${text}"
🔤 Перевод: [Функция перевода требует API ключ Google Translate]

💡 Для реального перевода нужен API ключ Google Cloud Translation!
  `;
  
  bot.sendMessage(chatId, translateMessage);
});

// Обработчик команды /gif (заглушка)
bot.onText(/\/gif (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  
  const gifMessage = `
🎬 Поиск GIF:

🔍 Запрос: "${query}"
🎭 Результат: [Функция поиска GIF требует API ключ Giphy]

💡 Для поиска GIF нужен API ключ Giphy!
  `;
  
  bot.sendMessage(chatId, gifMessage);
});

// Обработчик команды /wiki (заглушка)
bot.onText(/\/wiki (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];
  
  const wikiMessage = `
📚 Поиск в Wikipedia:

🔍 Запрос: "${query}"
📖 Результат: [Функция поиска требует интеграцию с Wikipedia API]

💡 Для поиска в Wikipedia нужна интеграция с MediaWiki API!
  `;
  
  bot.sendMessage(chatId, wikiMessage);
});

// Обработчик обычных сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  if (msg.text && !msg.text.startsWith('/')) {
    const responses = [
      'Интересно! Что еще вы хотели бы узнать?',
      'Понятно! Попробуйте одну из команд с API.',
      'Хорошо! Используйте /help для списка команд.',
      'Спасибо за сообщение!',
      'Я готов помочь с API интеграциями!'
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    bot.sendMessage(chatId, randomResponse);
  }
});

// Обработчик ошибок
bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});

bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

// Обработчик завершения работы
process.on('SIGINT', () => {
  console.log('Завершение работы бота с API интеграциями...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 Telegram бот с API интеграциями запущен!');
console.log('Используйте Ctrl+C для остановки.');
console.log('⚠️ Для полной функциональности настройте API ключи!');
