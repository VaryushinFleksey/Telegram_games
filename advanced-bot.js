const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: './config.env' });

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Хранилище для пользователей (в реальном проекте используйте базу данных)
const userStats = new Map();

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username || 'Неизвестный пользователь';
  
  // Инициализируем статистику пользователя
  if (!userStats.has(userId)) {
    userStats.set(userId, {
      username: username,
      messagesCount: 0,
      commandsCount: 0,
      firstSeen: new Date(),
      lastSeen: new Date()
    });
  }
  
  const welcomeMessage = `
🤖 Добро пожаловать, ${username}!

Я расширенный Telegram бот с множеством функций.

📋 Доступные команды:
/start - Начать работу с ботом
/help - Показать справку
/echo [текст] - Повторить ваш текст
/time - Показать текущее время
/weather [город] - Погода (заглушка)
/random [min] [max] - Случайное число
/stats - Ваша статистика
/calc [выражение] - Калькулятор
/joke - Случайная шутка
/quote - Случайная цитата
/translate [текст] - Перевод (заглушка)

💡 Просто напишите мне сообщение, и я отвечу!
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 Подробная справка по командам:

🔹 Основные команды:
/start - Начать работу с ботом
/help - Показать эту справку

🔹 Информационные команды:
/time - Показать текущее время
/stats - Ваша статистика использования

🔹 Утилиты:
/echo [текст] - Повторить ваш текст
/random [min] [max] - Случайное число в диапазоне
/calc [выражение] - Простой калькулятор

🔹 Развлекательные:
/joke - Случайная шутка
/quote - Случайная мотивирующая цитата
/weather [город] - Погода (заглушка)
/translate [текст] - Перевод (заглушка)

💡 Вы также можете просто написать сообщение!
  `;
  
  bot.sendMessage(chatId, helpMessage);
});

// Обработчик команды /echo
bot.onText(/\/echo (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const echo = match[1];
  bot.sendMessage(chatId, `📢 Эхо: ${echo}`);
});

// Обработчик команды /time
bot.onText(/\/time/, (msg) => {
  const chatId = msg.chat.id;
  const now = new Date();
  const timeString = now.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  bot.sendMessage(chatId, `🕐 Текущее время: ${timeString}`);
});

// Обработчик команды /random
bot.onText(/\/random(?: (\d+)(?: (\d+))?)?/, (msg, match) => {
  const chatId = msg.chat.id;
  let min = 1;
  let max = 100;
  
  if (match[1]) {
    min = parseInt(match[1]);
    if (match[2]) {
      max = parseInt(match[2]);
    } else {
      max = min;
      min = 1;
    }
  }
  
  if (min > max) [min, max] = [max, min];
  
  const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
  bot.sendMessage(chatId, `🎲 Случайное число от ${min} до ${max}: ${randomNumber}`);
});

// Обработчик команды /calc
bot.onText(/\/calc (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const expression = match[1];
  
  try {
    // Безопасное вычисление математических выражений
    const sanitizedExpression = expression.replace(/[^0-9+\-*/().\s]/g, '');
    const result = eval(sanitizedExpression);
    
    if (isFinite(result)) {
      bot.sendMessage(chatId, `🧮 ${expression} = ${result}`);
    } else {
      bot.sendMessage(chatId, '❌ Некорректное математическое выражение');
    }
  } catch (error) {
    bot.sendMessage(chatId, '❌ Ошибка в вычислении');
  }
});

// Обработчик команды /stats
bot.onText(/\/stats/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  if (userStats.has(userId)) {
    const stats = userStats.get(userId);
    const now = new Date();
    const timeDiff = Math.floor((now - stats.firstSeen) / (1000 * 60 * 60 * 24)); // дни
    
    const statsMessage = `
📊 Статистика пользователя ${stats.username}:

📝 Сообщений: ${stats.messagesCount}
⚡ Команд: ${stats.commandsCount}
📅 Первый раз: ${stats.firstSeen.toLocaleDateString('ru-RU')}
⏰ Дней с нами: ${timeDiff}
🕐 Последний раз: ${stats.lastSeen.toLocaleString('ru-RU')}
    `;
    
    bot.sendMessage(chatId, statsMessage);
  } else {
    bot.sendMessage(chatId, '❌ Статистика не найдена. Отправьте /start для начала работы.');
  }
});

// Обработчик команды /joke
bot.onText(/\/joke/, (msg) => {
  const chatId = msg.chat.id;
  const jokes = [
    'Почему программисты путают Рождество и Хэллоуин? Потому что Oct 31 == Dec 25!',
    'Как программист ломает голову? Git push --force!',
    'Что сказал программист на свадьбе? "Да" в двоичной системе!',
    'Почему программисты не любят природу? Там слишком много багов!',
    'Как программист открывает банку? Ctrl+Alt+Delete!',
    'Что программист делает в лифте? Нажимает кнопку "0"!',
    'Почему программисты носят очки? Потому что они не могут C#!'
  ];
  
  const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
  bot.sendMessage(chatId, `😄 ${randomJoke}`);
});

// Обработчик команды /quote
bot.onText(/\/quote/, (msg) => {
  const chatId = msg.chat.id;
  const quotes = [
    '"Код - это поэзия логики." - Linus Torvalds',
    '"Программирование - это искусство создания чего-то из ничего." - Anonymous',
    '"Лучший код - это код, который легко читать." - Martin Fowler',
    '"Программист - это человек, который решает проблемы, о существовании которых вы даже не подозревали." - Anonymous',
    '"Код должен быть написан так, чтобы его было легко читать людям, а не машинам." - Harold Abelson',
    '"Программирование - это не наука, это ремесло." - Richard Stallman',
    '"Хороший программист - это ленивый программист." - Larry Wall'
  ];
  
  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  bot.sendMessage(chatId, `💭 ${randomQuote}`);
});

// Обработчик команды /weather
bot.onText(/\/weather(?: (.+))?/, (msg, match) => {
  const chatId = msg.chat.id;
  const city = match[1] || 'Москва';
  
  const weatherResponses = [
    `🌤️ В городе ${city} сегодня солнечно, температура 22°C`,
    `🌧️ В городе ${city} ожидается дождь, температура 15°C`,
    `❄️ В городе ${city} холодно, температура -5°C`,
    `🌡️ В городе ${city} жарко, температура 35°C`,
    `☁️ В городе ${city} облачно, температура 18°C`
  ];
  
  const randomWeather = weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
  bot.sendMessage(chatId, randomWeather);
});

// Обработчик команды /translate
bot.onText(/\/translate (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  
  // Простая заглушка для перевода
  const translations = {
    'hello': 'привет',
    'world': 'мир',
    'goodbye': 'до свидания',
    'thank you': 'спасибо',
    'yes': 'да',
    'no': 'нет'
  };
  
  const lowerText = text.toLowerCase();
  if (translations[lowerText]) {
    bot.sendMessage(chatId, `🌐 Перевод: "${text}" → "${translations[lowerText]}"`);
  } else {
    bot.sendMessage(chatId, `🌐 Перевод: "${text}" → [Функция перевода в разработке]`);
  }
});

// Обработчик обычных сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Игнорируем команды
  if (msg.text && msg.text.startsWith('/')) {
    // Обновляем статистику команд
    if (userStats.has(userId)) {
      const stats = userStats.get(userId);
      stats.commandsCount++;
      stats.lastSeen = new Date();
      userStats.set(userId, stats);
    }
    return;
  }
  
  // Отвечаем на обычные сообщения
  if (msg.text) {
    // Обновляем статистику сообщений
    if (userStats.has(userId)) {
      const stats = userStats.get(userId);
      stats.messagesCount++;
      stats.lastSeen = new Date();
      userStats.set(userId, stats);
    }
    
    const responses = [
      'Интересно! Расскажите больше.',
      'Понятно! Что-нибудь еще?',
      'Хорошо! Есть ли у вас вопросы?',
      'Спасибо за сообщение!',
      'Я вас слушаю...',
      'Продолжайте, это интересно!',
      'Отличная мысль!',
      'Понял вас!',
      'Очень интересно!',
      'Спасибо за информацию!'
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
  console.log('Завершение работы расширенного бота...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 Расширенный Telegram бот запущен!');
console.log('Используйте Ctrl+C для остановки.');
console.log('📊 Статистика пользователей активна');
