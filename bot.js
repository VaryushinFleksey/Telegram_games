const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: './config.env' });

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const welcomeMessage = `
🤖 Добро пожаловать! Я ваш Telegram бот.

Доступные команды:
/start - Начать работу с ботом
/help - Показать справку
/echo [текст] - Повторить ваш текст
/time - Показать текущее время
/weather - Погода (заглушка)
/random - Случайное число от 1 до 100

Просто напишите мне сообщение, и я отвечу!
  `;
  
  bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  const helpMessage = `
📚 Справка по командам:

/start - Начать работу с ботом
/help - Показать эту справку
/echo [текст] - Повторить ваш текст
/time - Показать текущее время
/weather - Погода (заглушка)
/random - Случайное число от 1 до 100

💡 Вы также можете просто написать сообщение, и я отвечу!
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

// Обработчик команды /weather
bot.onText(/\/weather/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🌤️ Функция погоды пока не реализована. Это заглушка для демонстрации!');
});

// Обработчик команды /random
bot.onText(/\/random/, (msg) => {
  const chatId = msg.chat.id;
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  bot.sendMessage(chatId, `🎲 Случайное число: ${randomNumber}`);
});

// Обработчик обычных сообщений
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  
  // Игнорируем команды
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }
  
  // Отвечаем на обычные сообщения
  if (msg.text) {
    const responses = [
      'Интересно! Расскажите больше.',
      'Понятно! Что-нибудь еще?',
      'Хорошо! Есть ли у вас вопросы?',
      'Спасибо за сообщение!',
      'Я вас слушаю...',
      'Продолжайте, это интересно!',
      'Отличная мысль!',
      'Понял вас!'
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
  console.log('Завершение работы бота...');
  bot.stopPolling();
  process.exit(0);
});

console.log('🤖 Telegram бот запущен!');
console.log('Используйте Ctrl+C для остановки.');
