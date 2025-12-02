// script.js

const wordsData = [
    { en: "Tuesday", uk: "Вівторок" },
    { en: "Woman", uk: "Жінка" },
    { en: "How old are you", uk: "Скільки тобі років" },
    { en: "Boy", uk: "Хлопчик" },
    { en: "Wednesday", uk: "Середа" },
    { en: "Girl", uk: "Дівчинка" },
    { en: "Saturday", uk: "Субота" },
    { en: "Friday", uk: "П'ятниця" },
    { en: "Thursday", uk: "Четвер" },
    { en: "Man", uk: "Чоловік" },
    { en: "Sunday", uk: "Неділя" },
];

let selectedEnglishCard = null;
let selectedUkrainianCard = null;
let currentConnections = []; // Зберігає об'єкти {enCard: element, ukCard: element}

const englishColumn = document.getElementById('english-column');
const ukrainianColumn = document.getElementById('ukrainian-column');
const finalCheckButton = document.getElementById('final-check-button');
const resetButton = document.getElementById('reset-button');
const messageArea = document.getElementById('message-area');

const canvas = document.getElementById('line-canvas');
const ctx = canvas.getContext('2d');
const gameAreaWrapper = document.querySelector('.game-area-wrapper');

// Функція для перемішування масиву (алгоритм Фішера-Єйтса)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Функція для створення картки зі словом
function createWordCard(word, type) {
    const card = document.createElement('div');
    card.classList.add('word-card');
    card.textContent = word;
    card.dataset.type = type; // 'en' або 'uk'
    card.dataset.word = word; // Зберігаємо саме слово для порівняння
    card.addEventListener('click', () => handleCardClick(card));
    return card;
}

// Обробник кліку на картку
function handleCardClick(card) {
    // Ігноруємо кліки, якщо картка вже знаходиться в стані 'connected', 'correct-match' або 'incorrect-match'
    if (card.classList.contains('connected') || card.classList.contains('correct-match') || card.classList.contains('incorrect-match')) {
        return;
    }

    // Прибираємо 'selected' з попередньо вибраної картки того ж типу
    if (card.dataset.type === 'en') {
        if (selectedEnglishCard) {
            selectedEnglishCard.classList.remove('selected');
        }
        selectedEnglishCard = card;
    } else { // type === 'uk'
        if (selectedUkrainianCard) {
            selectedUkrainianCard.classList.remove('selected');
        }
        selectedUkrainianCard = card;
    }

    // Додаємо 'selected' до поточної картки
    card.classList.add('selected');

    // Якщо вибрано по одній картці з кожної колонки, намагаємося створити з'єднання
    if (selectedEnglishCard && selectedUkrainianCard) {
        // Перевіряємо, чи вже існує з'єднання для однієї з цих карток
        const existingEnConnectionIndex = currentConnections.findIndex(conn => conn.enCard === selectedEnglishCard);
        const existingUkConnectionIndex = currentConnections.findIndex(conn => conn.ukCard === selectedUkrainianCard);

        if (existingEnConnectionIndex !== -1 || existingUkConnectionIndex !== -1) {
            // Якщо одна з карток вже з'єднана, скидаємо вибір і виходимо
            messageArea.textContent = 'Ці слова вже з\'єднані або вибрані в іншому зв\'язку. Скиньте вибір, щоб продовжити.';
            messageArea.classList.add('message-info');
            setTimeout(() => {
                messageArea.textContent = '';
                messageArea.classList.remove('message-info');
            }, 2000); // Повідомлення зникне через 2 секунди

            if (selectedEnglishCard) selectedEnglishCard.classList.remove('selected');
            if (selectedUkrainianCard) selectedUkrainianCard.classList.remove('selected');
            selectedEnglishCard = null;
            selectedUkrainianCard = null;
            return;
        }

        makeConnection(selectedEnglishCard, selectedUkrainianCard);
        selectedEnglishCard = null; // Скидаємо вибір після з'єднання
        selectedUkrainianCard = null;
        messageArea.textContent = ''; // Очищаємо повідомлення
        messageArea.classList.remove('message-info');
    }

    // Оновлюємо стан кнопки "Перевірити всі пари"
    updateFinalCheckButtonState();
}

// Функція для створення з'єднання (малювання лінії та переміщення карток)
function makeConnection(enCard, ukCard) {
    currentConnections.push({ enCard: enCard, ukCard: ukCard });

    // Позначаємо картки як з'єднані (візуально)
    enCard.classList.remove('selected');
    ukCard.classList.remove('selected');
    enCard.classList.add('connected');
    ukCard.classList.add('connected');
    
    // Переміщуємо з'єднані картки на початок списку
    englishColumn.prepend(enCard);
    ukrainianColumn.prepend(ukCard);

    drawLines(); // Перемальовуємо всі лінії
}

// Функція для отримання координат центру картки відносно gameAreaWrapper
function getCardCenter(card) {
    const rect = card.getBoundingClientRect();
    const gameAreaRect = gameAreaWrapper.getBoundingClientRect();

    return {
        x: rect.left + rect.width / 2 - gameAreaRect.left,
        y: rect.top + rect.height / 2 - gameAreaRect.top
    };
}

// Функція для малювання всіх ліній
function drawLines() {
    // Оновлюємо розміри canvas до розмірів батьківського елемента
    // Це важливо для коректного відображення на різних екранах/змінах розміру вікна
    canvas.width = gameAreaWrapper.clientWidth;
    canvas.height = gameAreaWrapper.clientHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаємо canvas

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#22d3ee'; // Колір ліній (Cyan-400)

    currentConnections.forEach(connection => {
        // Перевіряємо, чи картки ще існують в DOM (можуть бути видалені при скиданні)
        if (document.body.contains(connection.enCard) && document.body.contains(connection.ukCard)) {
            const start = getCardCenter(connection.enCard);
            const end = getCardCenter(connection.ukCard);

            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    });
}

// Функція перевірки всіх з'єднань (фінальна перевірка)
function finalCheck() {
    if (currentConnections.length === 0) {
        messageArea.textContent = 'Будь ласка, з\'єднайте хоча б одну пару!';
        messageArea.classList.add('message-info');
        return;
    }

    // Спочатку очищаємо всі попередні стани результатів (якщо була попередня перевірка)
    document.querySelectorAll('.word-card').forEach(card => {
        card.classList.remove('correct-match', 'incorrect-match', 'shake');
        card.style.pointerEvents = 'auto'; // Повертаємо клікабельність для скидання
    });
    
    // Зберігаємо поточні з'єднання для ітерації, а потім очищаємо
    const connectionsToCheck = [...currentConnections];
    currentConnections = []; // Очищаємо, щоб додати тільки правильні з'єднання назад

    let correctCount = 0;

    connectionsToCheck.forEach(connection => {
        const englishWord = connection.enCard.dataset.word;
        const ukrainianWord = connection.ukCard.dataset.word;

        // Шукаємо відповідну пару в wordsData
        const isCorrect = wordsData.some(pair => 
            pair.en === englishWord && pair.uk === ukrainianWord
        );

        connection.enCard.classList.remove('connected', 'selected');
        connection.ukCard.classList.remove('connected', 'selected');

        if (isCorrect) {
            connection.enCard.classList.add('correct-match');
            connection.ukCard.classList.add('correct-match');
            connection.enCard.style.pointerEvents = 'none'; // Вимикаємо кліки на правильних
            connection.ukCard.style.pointerEvents = 'none';
            correctCount++;
            currentConnections.push(connection); // Додаємо правильне з'єднання назад
        } else {
            connection.enCard.classList.add('incorrect-match');
            connection.ukCard.classList.add('incorrect-match');
            
            // Видаляємо incorrect-match та скидаємо картки через короткий час
            setTimeout(() => {
                connection.enCard.classList.remove('incorrect-match');
                connection.ukCard.classList.remove('incorrect-match');
                // Переміщуємо назад у вихідну колонку, якщо це неправильне з'єднання
                englishColumn.appendChild(connection.enCard); // Просто додаємо в кінець колонки
                ukrainianColumn.appendChild(connection.ukCard); // Додаємо в кінець колонки
                
                connection.enCard.style.pointerEvents = 'auto'; // Повертаємо клікабельність
                connection.ukCard.style.pointerEvents = 'auto';
                drawLines(); // Перемальовуємо лінії після скидання неправильних
                updateFinalCheckButtonState(); // Оновлюємо кнопку після скидання
            }, 1000);
        }
    });

    if (correctCount === wordsData.length) {
        messageArea.textContent = 'Чудово! Всі пари правильні!';
        messageArea.classList.add('message-success');
        messageArea.classList.remove('message-error', 'message-info');
        finalCheckButton.disabled = true; // Деактивуємо, бо все правильно
    } else {
        messageArea.textContent = `Ви з'єднали ${correctCount} з ${wordsData.length} пар правильно. Спробуйте ще раз!`;
        messageArea.classList.add('message-error');
        messageArea.classList.remove('message-success', 'message-info');
    }
    
    drawLines(); // Перемальовуємо лінії для відображення тільки правильних
}

// Функція оновлення стану кнопки фінальної перевірки
function updateFinalCheckButtonState() {
    finalCheckButton.disabled = (currentConnections.length === 0);
}

// Функція скидання гри
// function resetGame() {
//     currentConnections = [];
//     selectedEnglishCard = null;
//     selectedUkrainianCard = null;
//     messageArea.textContent = '';
//     messageArea.classList.remove('message-success', 'message-error', 'message-info');
//     ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаємо canvas

//     initializeGame(); // Повторна ініціалізація, щоб перемішати слова знову
//     updateFinalCheckButtonState();
// }

// Функція ініціалізації гри
function initializeGame() {
    englishColumn.innerHTML = '';
    ukrainianColumn.innerHTML = '';
    finalCheckButton.disabled = true;

    // Створюємо окремі масиви для англійських та українських слів, зберігаючи їхні відповідності
    const shuffledEnglishWords = shuffleArray(wordsData.map(pair => pair.en));
    const shuffledUkrainianWords = shuffleArray(wordsData.map(pair => pair.uk));

    // Додаємо картки в DOM
    shuffledEnglishWords.forEach(word => {
        englishColumn.appendChild(createWordCard(word, 'en'));
    });

    shuffledUkrainianWords.forEach(word => {
        ukrainianColumn.appendChild(createWordCard(word, 'uk'));
    });

    // Оновлюємо розміри canvas після того, як картки додані в DOM
    // Використовуємо requestAnimationFrame для забезпечення, що DOM оновлено
    requestAnimationFrame(() => {
        canvas.width = gameAreaWrapper.clientWidth;
        canvas.height = gameAreaWrapper.clientHeight;
        drawLines(); // Перемальовуємо лінії
    });
}

// Додаємо слухачі подій
finalCheckButton.addEventListener('click', finalCheck);
// resetButton.addEventListener('click', resetGame);

// Обробник зміни розміру вікна для перемальовування ліній
window.addEventListener('resize', () => {
    drawLines();
});

// Ініціалізуємо гру при завантаженні сторінки
document.addEventListener('DOMContentLoaded', initializeGame);