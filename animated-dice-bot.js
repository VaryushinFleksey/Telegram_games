const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config({ path: './config.env' });

// Создаем экземпляр бота
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// Устанавливаем команды для отображения в меню Telegram
bot.setMyCommands([
    { command: 'start', description: '🎲 Начать игру в кости' },
    { command: 'dice', description: '🎯 Бросить кубик (1-6)' },
    { command: 'roll', description: '⚡ Быстрый бросок кубика' },
    { command: 'daily', description: '📅 Оставшиеся попытки на сегодня' },
    { command: 'stats', description: '📊 Статистика всех игроков в чате' },
    { command: 'commands', description: 'ℹ️ Показать все доступные команды' },
    { command: 'help', description: '❓ Справка по игре' }
]);

// Хранилище для статистики игры в кости
// Структура: Map<chatId, Map<userId, userStats>>
const chatStats = new Map();

// Функция для получения статистики чата
function getChatStats(chatId) {
    if (!chatStats.has(chatId)) {
        chatStats.set(chatId, {
            users: new Map(),
            global: {
                totalRolls: 0,
                totalScore: 0,
                averageScore: 0,
                bestRoll: 0,
                worstRoll: 6
            }
        });
    }
    return chatStats.get(chatId);
}

// Функция для получения статистики пользователя в чате
function getUserStats(chatId, userId) {
    const chat = getChatStats(chatId);
    if (!chat.users.has(userId)) {
        return null;
    }
    return chat.users.get(userId);
}

// Функция для проверки лимита бросков в сутки
function checkDailyLimit(chatId, userId) {
    const user = getUserStats(chatId, userId);
    if (!user) return { canRoll: true, remaining: 3 };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Если это новый день, сбрасываем счетчик
    if (!user.lastRollDate || user.lastRollDate < today) {
        user.dailyRolls = 0;
        user.lastRollDate = today;
    }

    const remaining = 3 - user.dailyRolls;
    return { canRoll: remaining > 0, remaining: Math.max(0, remaining) };
}

// Функция для увеличения счетчика бросков в сутки
function incrementDailyRolls(chatId, userId) {
    const user = getUserStats(chatId, userId);
    if (!user) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Если это новый день, сбрасываем счетчик
    if (!user.lastRollDate || user.lastRollDate < today) {
        user.dailyRolls = 0;
        user.lastRollDate = today;
    }

    user.dailyRolls++;
}

// Эмодзи для кубиков (1-6)
const diceEmojis = {
    1: '⚀',
    2: '⚁',
    3: '⚂',
    4: '⚃',
    5: '⚄',
    6: '⚅'
};

// Эмодзи для анимации кручения
const spinningEmojis = ['🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎲'];

// Альтернативная анимация без редактирования сообщений
const alternativeSpinningEmojis = ['🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎲', '🎪', '🎨', '🎭'];

// Обработчик команды /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику пользователя
    const chat = getChatStats(chatId);
    if (!chat.users.has(userId)) {
        chat.users.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null,
            dailyRolls: 0,
            lastRollDate: null
        });
    }

    const welcomeMessage = `
🎲 Добро пожаловать в игру "Кости"!

Я бот для игры в кости в групповом чате с красивыми анимациями и статистикой всех участников.

🎯 Просто напишите /dice чтобы начать играть!
📋 Используйте /commands для просмотра всех команд

📅 **Лимит:** 3 броска в сутки на игрока
🔄 **Сброс:** Каждый день в 00:00
  `;

    bot.sendMessage(chatId, welcomeMessage);
});

// Обработчик команды /help
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
📚 Справка по игре "Кости":

🎲 Команды для игры:
/dice - Бросить кубик (1-6)
/roll - Быстрый бросок
/daily - Оставшиеся попытки на сегодня

📊 Статистика:
/stats - Статистика всех игроков в чате

💡 Каждый бросок записывается в статистику!
🎪 Анимации делают игру более захватывающей!

📋 Используйте /commands для просмотра всех доступных команд
  `;

    bot.sendMessage(chatId, helpMessage);
});

// Функция для броска кубиков
function rollDice(count = 1) {
    const rolls = [];
    let total = 0;

    for (let i = 0; i < count; i++) {
        // Настоящий случайный бросок кубика (1-6)
        const roll = Math.floor(Math.random() * 6) + 1;
        rolls.push(roll);
        total += roll;
    }

    return { rolls, total };
}

// Функция для обновления статистики
function updateStats(chatId, userId, rolls, total) {
    const chat = getChatStats(chatId);
    let user = chat.users.get(userId);

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

    // Обновляем глобальную статистику чата
    chat.global.totalRolls++;
    chat.global.totalScore += total;
    chat.global.averageScore = Math.round((chat.global.totalScore / chat.global.totalRolls) * 100) / 100;
    if (total > chat.global.bestRoll) chat.global.bestRoll = total;
    if (total < chat.global.worstRoll) chat.global.worstRoll = total;

    // Увеличиваем счетчик бросков в сутки
    incrementDailyRolls(chatId, userId);
}

// Функция для анимированного броска с эффектом кручения
async function animatedDiceRoll(chatId, userId, count = 1) {
    const user = getUserStats(chatId, userId);
    const username = user?.username || 'Неизвестный игрок';

    // Показываем "печатает" индикатор
    bot.sendChatAction(chatId, 'typing');

    // Отправляем сообщение о начале броска
    const startMessage = await bot.sendMessage(chatId, `🎲 ${username} бросает ${count === 1 ? 'кубик' : count + ' кубика'}...`);

    // Эффект кручения - отправляем несколько сообщений с разными эмодзи
    let lastText = `🎲 ${username} бросает ${count === 1 ? 'кубик' : count + ' кубика'}...`;

    for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 600)); // Пауза 600мс

        // Генерируем новый текст, который точно отличается от предыдущего
        const spinningEmoji = spinningEmojis[Math.floor(Math.random() * spinningEmojis.length)];
        const newText = `${spinningEmoji} Крутим кубики... (${i + 1}/3)`;

        // Проверяем, что текст отличается
        if (newText !== lastText) {
            try {
                await bot.editMessageText(newText, {
                    chat_id: chatId,
                    message_id: startMessage.message_id
                });
                lastText = newText;
            } catch (error) {
                console.log('Ошибка редактирования сообщения:', error.message);
                // Продолжаем выполнение даже при ошибке
            }
        }
    }

    // Финальная пауза перед результатом
    await new Promise(resolve => setTimeout(resolve, 800));

    // Бросаем кубики
    const { rolls, total } = rollDice(count);
    updateStats(chatId, userId, rolls, total);

    // Формируем результат
    let resultText = '';
    if (count === 1) {
        resultText = `${diceEmojis[rolls[0]]} Результат: ${rolls[0]}`;
    } else {
        resultText = rolls.map(r => diceEmojis[r]).join(' + ') + ` = ${total}`;
    }

    // Отправляем финальный результат
    const finalMessage = `
🎲 Бросок ${count === 1 ? 'кубика' : count + ' кубиков'} для ${username}:

${resultText}

📊 Ваша статистика:
🎯 Всего бросков: ${user.totalRolls}
⭐ Средний результат: ${user.averageScore}
🏆 Лучший результат: ${user.bestRoll}
📉 Худший результат: ${user.worstRoll}
    `;

    // Удаляем сообщение о кручении и отправляем результат
    try {
        await bot.deleteMessage(chatId, startMessage.message_id);
    } catch (error) {
        console.log('Ошибка удаления сообщения:', error.message);
        // Продолжаем выполнение даже при ошибке
    }

    bot.sendMessage(chatId, finalMessage);
}

// Обработчик команды /dice (анимированный бросок 1 кубика)
bot.onText(/\/dice/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику если нужно
    const chat = getChatStats(chatId);
    if (!chat.users.has(userId)) {
        chat.users.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null,
            dailyRolls: 0,
            lastRollDate: null
        });
    }

    // Проверяем лимит бросков в сутки
    const limitCheck = checkDailyLimit(chatId, userId);
    if (!limitCheck.canRoll) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilTomorrow = tomorrow - new Date();
        const hours = Math.floor(timeUntilTomorrow / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilTomorrow % (1000 * 60 * 60)) / (1000 * 60));

        bot.sendMessage(chatId, `❌ Вы уже использовали все 3 попытки на сегодня!\n\n🕐 Следующая попытка завтра в 00:00\n⏰ Осталось: ${hours}ч ${minutes}м`);
        return;
    }

    // Запускаем анимированный бросок
    await animatedDiceRoll(chatId, userId, 1);
});





// Обработчик команды /roll (быстрый бросок с эффектом кручения)
bot.onText(/\/roll/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику если нужно
    const chat = getChatStats(chatId);
    if (!chat.users.has(userId)) {
        chat.users.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null,
            dailyRolls: 0,
            lastRollDate: null
        });
    }

    // Проверяем лимит бросков в сутки
    const limitCheck = checkDailyLimit(chatId, userId);
    if (!limitCheck.canRoll) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilTomorrow = tomorrow - new Date();
        const hours = Math.floor(timeUntilTomorrow / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilTomorrow % (1000 * 60 * 60)) / (1000 * 60));

        bot.sendMessage(chatId, `❌ Вы уже использовали все 3 попытки на сегодня!\n\n🕐 Следующая попытка завтра в 00:00\n⏰ Осталось: ${hours}ч ${minutes}м`);
        return;
    }

    // Показываем "печатает" индикатор
    bot.sendChatAction(chatId, 'typing');

    // Отправляем сообщение о кручении
    const spinMessage = await bot.sendMessage(chatId, `🎲 ${username} крутит кубик...`);

    // Эффект кручения
    let lastText = `🎲 ${username} крутит кубик...`;

    for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));

        // Генерируем новый текст, который точно отличается
        const spinningEmoji = spinningEmojis[Math.floor(Math.random() * spinningEmojis.length)];
        const newText = `${spinningEmoji} Крутим... (${i + 1}/5)`;

        // Проверяем, что текст отличается
        if (newText !== lastText) {
            try {
                await bot.editMessageText(newText, {
                    chat_id: chatId,
                    message_id: spinMessage.message_id
                });
                lastText = newText;
            } catch (error) {
                console.log('Ошибка редактирования сообщения:', error.message);
                // Продолжаем выполнение даже при ошибке
            }
        }
    }

    // Финальная пауза
    await new Promise(resolve => setTimeout(resolve, 500));

    // Бросаем кубик
    const { rolls, total } = rollDice(1);
    updateStats(chatId, userId, rolls, total);

    // Отправляем результат
    const resultMessage = `
🎲 Быстрый бросок для ${username}:

${diceEmojis[rolls[0]]} Результат: ${rolls[0]}

📊 Ваша статистика:
🎯 Всего бросков: ${chat.users.get(userId).totalRolls}
⭐ Средний результат: ${chat.users.get(userId).averageScore}
🏆 Лучший результат: ${chat.users.get(userId).bestRoll}
📉 Худший результат: ${chat.users.get(userId).worstRoll}
    `;

    // Удаляем сообщение о кручении и отправляем результат
    try {
        await bot.deleteMessage(chatId, spinMessage.message_id);
    } catch (error) {
        console.log('Ошибка удаления сообщения:', error.message);
        // Продолжаем выполнение даже при ошибке
    }

    bot.sendMessage(chatId, resultMessage);
});



// Обработчик команды /daily (оставшиеся попытки на сегодня)
bot.onText(/\/daily/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name || 'Неизвестный игрок';

    // Инициализируем статистику если нужно
    const chat = getChatStats(chatId);
    if (!chat.users.has(userId)) {
        chat.users.set(userId, {
            username: username,
            totalRolls: 0,
            totalScore: 0,
            averageScore: 0,
            bestRoll: 0,
            worstRoll: 6,
            rollsHistory: [],
            firstRoll: null,
            lastRoll: null,
            dailyRolls: 0,
            lastRollDate: null
        });
    }

    const limitCheck = checkDailyLimit(chatId, userId);
    const remaining = limitCheck.remaining;

    let message = `📅 **Дневной лимит для ${username}:**\n\n`;

    if (remaining > 0) {
        message += `✅ Осталось попыток: **${remaining}**\n`;
        message += `🎲 Использовано сегодня: **${3 - remaining}**\n`;
        message += `🔄 Сброс лимита: **завтра в 00:00**`;
    } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const timeUntilTomorrow = tomorrow - new Date();
        const hours = Math.floor(timeUntilTomorrow / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilTomorrow % (1000 * 60 * 60)) / (1000 * 60));

        message += `❌ Лимит исчерпан!\n`;
        message += `🕐 Следующая попытка: **завтра в 00:00**\n`;
        message += `⏰ Осталось: **${hours}ч ${minutes}м**`;
    }

    bot.sendMessage(chatId, message);
});

// Обработчик команды /stats (статистика всех игроков в чате)
bot.onText(/\/stats/, (msg) => {
    const chatId = msg.chat.id;
    const chat = getChatStats(chatId);

    if (chat.users.size === 0) {
        bot.sendMessage(chatId, '❌ Пока нет данных для статистики. Сыграйте хотя бы раз!');
        return;
    }

    // Сортируем игроков по общему счету (по убыванию)
    const sortedPlayers = Array.from(chat.users.values())
        .sort((a, b) => b.totalScore - a.totalScore);

    // Создаем простую статистику
    let statsMessage = `📊 **Статистика игроков в чате:**\n\n`;

    // Простой список игроков с очками и местами в топе
    sortedPlayers.forEach((player, index) => {
        const place = index + 1;
        statsMessage += `${place}-е место: **${player.username}** - ${player.totalScore} очков\n`;
    });

    bot.sendMessage(chatId, statsMessage);
});



// Обработчик команды /commands (показать доступные команды)
bot.onText(/\/commands/, (msg) => {
    const chatId = msg.chat.id;

    const commandsMessage = `🎯 **Доступные команды:**\n\n`;
    commandsMessage += `🎲 **Игра:**\n`;
    commandsMessage += `/dice - Бросить кубик (1-6)\n`;
    commandsMessage += `/roll - Быстрый бросок\n`;
    commandsMessage += `/daily - Оставшиеся попытки на сегодня\n\n`;
    commandsMessage += `📊 **Статистика:**\n`;
    commandsMessage += `/stats - Статистика всех игроков в чате\n\n`;
    commandsMessage += `ℹ️ **Справка:**\n`;
    commandsMessage += `/start - Начать игру\n`;
    commandsMessage += `/help - Показать справку\n`;
    commandsMessage += `/commands - Показать все команды`;

    bot.sendMessage(chatId, commandsMessage);
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
            '🎲 Хотите сыграть в кости? Используйте /dice для броска кубика!',
            '🎯 Готов к игре! Команда /dice для броска кубика.',
            '🎲 Давайте сыграем! /dice - бросок кубика, /roll - быстрый бросок.',
            '🎯 Используйте /stats чтобы посмотреть статистику всех игроков!',
            '🎯 /help - справка по всем командам игры.',
            '🎪 Анимации делают игру более захватывающей!'
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
    console.log('Завершение работы бота для игры в кости в групповом чате...');
    bot.stopPolling();
    process.exit(0);
});

console.log('🎲 Telegram бот для игры в кости в групповом чате запущен!');
console.log('Используйте Ctrl+C для остановки.');
console.log('📊 Статистика всех игроков активна');
console.log('🎪 Анимации и эффекты кручения активны');
console.log('🎯 Доступные команды: /dice, /roll, /daily, /stats, /commands');
