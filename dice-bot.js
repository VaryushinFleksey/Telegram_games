const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: './config.env' });

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Хранилище для статистики игры в кости
const diceStats = new Map();
const globalStats = {
    totalRolls: 0,
    totalScore: 0,
    averageScore: 0,
    bestRoll: 0,
    worstRoll: 6
};

// Эмодзи для кубиков (1-6)
const diceEmojis = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику пользователя
    if (!diceStats.has(userId)) {
        diceStats.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null
        });
    }

    const welcomeMessage = `
🎲 Добро пожаловать в игру "Кости"!

Я бот для игры в кости с красивыми эмодзи и подробной статистикой.

📋 Доступные команды:
/start - Начать игру
/help - Показать справку
/dice - Бросить кости (1 кубик)
/dice2 - Бросить 2 кубика
/dice3 - Бросить 3 кубика
/stats - Ваша личная статистика
/global - Общая статистика всех игроков
/leaderboard - Таблица лидеров

🎯 Просто напишите /dice чтобы начать играть!
  `;

    bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 Справка по игре "Кости":

🎲 Команды для игры:
/dice - Бросить 1 кубик (1-6)
/dice2 - Бросить 2 кубика (2-12)
/dice3 - Бросить 3 кубика (3-18)

📊 Статистика:
/stats - Ваша личная статистика
/global - Общая статистика всех игроков
/leaderboard - Таблица лидеров

💡 Каждый бросок записывается в статистику!
  `;

    bot.sendMessage(chatId, helpMessage);
});

// Функция для броска кубиков
function rollDice(count = 1) {
    const rolls = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        total += roll;
    }

    return { rolls, total };
}

// Функция для обновления статистики
function updateStats(userId, rolls, total) {
    const user = diceStats.get(userId);
    if (!user) return;

    // Обновляем статистику пользователя
    user.totalRolls++;
    user.totalScore += total;
    user.averageScore = Math.round((user.totalScore / user.totalRolls) * 100) / 100;
    user.rollsHistory.push({ rolls, total, timestamp: new Date() });
    user.lastRoll = new Date();

    if (!user.firstRoll) {
        user.firstRoll = new Date();
    }

    // Обновляем лучший и худший результат
    if (total > user.bestRoll) user.bestRoll = total;
    if (total < user.worstRoll) user.worstRoll = total;

    // Ограничиваем историю последними 50 бросками
    if (user.rollsHistory.length > 50) {
        user.rollsHistory = user.rollsHistory.slice(-50);
    }

    // Обновляем глобальную статистику
    globalStats.totalRolls++;
    globalStats.totalScore += total;
    globalStats.averageScore = Math.round((globalStats.totalScore / globalStats.totalRolls) * 100) / 100;
    if (total > globalStats.bestRoll) globalStats.bestRoll = total;
    if (total < globalStats.worstRoll) globalStats.worstRoll = total;
}

// Обработчик команды /dice (1 кубик)
bot.onText(/\/dice/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику если нужно
    if (!diceStats.has(userId)) {
        diceStats.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null
        });
    }

    const { rolls, total } = rollDice(1);
    updateStats(userId, rolls, total);

    const diceMessage = `
🎲 Бросок кубика для ${username}:

${diceEmojis[rolls[0]]} Результат: ${rolls[0]}

📊 Ваша статистика:
🎯 Всего бросков: ${diceStats.get(userId).totalRolls}
⭐ Средний результат: ${diceStats.get(userId).averageScore}
🏆 Лучший результат: ${diceStats.get(userId).bestRoll}
📉 Худший результат: ${diceStats.get(userId).worstRoll}
  `;

    bot.sendMessage(chatId, diceMessage);
});

// Обработчик команды /dice2 (2 кубика)
bot.onText(/\/dice2/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    if (!diceStats.has(userId)) {
        diceStats.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null
        });
    }

    const { rolls, total } = rollDice(2);
    updateStats(userId, rolls, total);

    const diceMessage = `
🎲 Бросок 2 кубиков для ${username}:

${diceEmojis[rolls[0]]} + ${diceEmojis[rolls[1]]} = ${total}

📊 Ваша статистика:
🎯 Всего бросков: ${diceStats.get(userId).totalRolls}
⭐ Средний результат: ${diceStats.get(userId).averageScore}
🏆 Лучший результат: ${diceStats.get(userId).bestRoll}
📉 Худший результат: ${diceStats.get(userId).worstRoll}
  `;

    bot.sendMessage(chatId, diceMessage);
});

// Обработчик команды /dice3 (3 кубика)
bot.onText(/\/dice3/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    if (!diceStats.has(userId)) {
        diceStats.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null
        });
    }

    const { rolls, total } = rollDice(3);
    updateStats(userId, rolls, total);

    const diceMessage = `
🎲 Бросок 3 кубиков для ${username}:

${diceEmojis[rolls[0]]} + ${diceEmojis[rolls[1]]} + ${diceEmojis[rolls[2]]} = ${total}

📊 Ваша статистика:
🎯 Всего бросков: ${diceStats.get(userId).totalRolls}
⭐ Средний результат: ${diceStats.get(userId).averageScore}
🏆 Лучший результат: ${diceStats.get(userId).bestRoll}
📉 Худший результат: ${diceStats.get(userId).worstRoll}
  `;

    bot.sendMessage(chatId, diceMessage);
});

// Обработчик команды /stats (личная статистика)
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!diceStats.has(userId)) {
        bot.sendMessage(chatId, '❌ У вас нет статистики. Сыграйте хотя бы раз командой /dice!');
        return;
    }

    const stats = diceStats.get(userId);
    const now = new Date();
    const timeDiff = stats.firstRoll ? Math.floor((now - stats.firstRoll) / (1000 * 60 * 60 * 24)) : 0;

    // Последние 5 бросков
    const recentRolls = stats.rollsHistory.slice(-5).reverse();
    let recentRollsText = '';
    if (recentRolls.length > 0) {
        recentRollsText = recentRolls.map(roll =>
            `${roll.rolls.map(r => diceEmojis[r]).join(' + ')} = ${roll.total}`
        ).join('\n');
    }

    const statsMessage = `
📊 Личная статистика игрока ${stats.username}:

🎯 Всего бросков: ${stats.totalRolls}
⭐ Общий счет: ${stats.totalScore}
📈 Средний результат: ${stats.averageScore}
🏆 Лучший результат: ${stats.bestRoll}
📉 Худший результат: ${stats.worstRoll}
📅 Дней в игре: ${timeDiff}
🕐 Первый бросок: ${stats.firstRoll ? stats.firstRoll.toLocaleDateString('ru-RU') : 'Нет данных'}
⏰ Последний бросок: ${stats.lastRoll ? stats.lastRoll.toLocaleString('ru-RU') : 'Нет данных'}

🎲 Последние 5 бросков:
${recentRollsText || 'Нет данных'}
  `;

    bot.sendMessage(chatId, statsMessage);
});

// Обработчик команды /global (общая статистика)
bot.onText(/\/global/, (msg) => {
    const chatId = msg.chat.id;

    const globalMessage = `
🌍 Общая статистика всех игроков:

🎯 Всего бросков: ${globalStats.totalRolls}
⭐ Общий счет: ${globalStats.totalScore}
📈 Средний результат: ${globalStats.averageScore}
🏆 Лучший результат: ${globalStats.bestRoll}
📉 Худший результат: ${globalStats.worstRoll}
👥 Активных игроков: ${diceStats.size}
  `;

    bot.sendMessage(chatId, globalMessage);
});

// Обработчик команды /leaderboard (таблица лидеров)
bot.onText(/\/leaderboard/, (msg) => {
    const chatId = msg.chat.id;

    if (diceStats.size === 0) {
        bot.sendMessage(chatId, '❌ Пока нет данных для таблицы лидеров. Сыграйте хотя бы раз!');
        return;
    }

    // Сортируем игроков по количеству бросков
    const sortedPlayers = Array.from(diceStats.values())
        .sort((a, b) => b.totalRolls - a.totalRolls)
        .slice(0, 10); // Топ-10

    let leaderboardText = '🏆 Таблица лидеров (по количеству бросков):\n\n';

    sortedPlayers.forEach((player, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        leaderboardText += `${medal} ${index + 1}. ${player.username}\n`;
        leaderboardText += `   🎯 Бросков: ${player.totalRolls} | ⭐ Среднее: ${player.averageScore} | 🏆 Лучший: ${player.bestRoll}\n\n`;
    });

    bot.sendMessage(chatId, leaderboardText);
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
            '🎲 Хотите сыграть в кости? Используйте /dice!',
            '🎯 Готов к игре! Команда /dice для броска кубика.',
            '🎲 Давайте сыграем! /dice - один кубик, /dice2 - два кубика.',
            '🎯 Используйте /stats чтобы посмотреть свою статистику!',
            '🎲 Команда /leaderboard покажет лучших игроков!',
            '🎯 /help - справка по всем командам игры.'
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
    console.log('Завершение работы бота для игры в кости...');
    bot.stopPolling();
    process.exit(0);
});

console.log('🎲 Telegram бот для игры в кости запущен!');
console.log('Используйте Ctrl+C для остановки.');
console.log('📊 Статистика игроков активна');
console.log('🎯 Доступные команды: /dice, /dice2, /dice3, /stats, /global, /leaderboard');

