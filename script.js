// --- Налаштування Canvas ---
const canvas = document.getElementById('tetris-canvas');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Налаштування для наступної фігури
const nextCanvas = document.getElementById('next-piece-canvas');
const nextContext = nextCanvas.getContext('2d');

const TILE_SIZE = 30; // Розмір одного блоку в пікселях

// Розміри ігрового поля
const ROW_COUNT = 20;
const COL_COUNT = 10;

// Масив кольорів для фігур
const COLORS = [
    null, // Індекс 0 для порожніх клітинок
    'cyan', 'blue', 'orange', 'yellow', 'lime', 'purple', 'red'
];

// Координати фігур (по 4 блоки)
const SHAPES = [
    // 0: Пустий
    [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ], 
    // I (1)
    [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0]
    ],
    // J (2)
    [
        [0, 2, 0, 0],
        [0, 2, 0, 0],
        [2, 2, 0, 0],
        [0, 0, 0, 0]
    ],
    // L (3)
    [
        [0, 3, 0, 0],
        [0, 3, 0, 0],
        [0, 3, 3, 0],
        [0, 0, 0, 0]
    ],
    // O (4)
    [
        [4, 4, 0, 0],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // S (5)
    [
        [0, 5, 5, 0],
        [5, 5, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // T (6)
    [
        [6, 6, 6, 0],
        [0, 6, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // Z (7)
    [
        [7, 7, 0, 0],
        [0, 7, 7, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ]
];

// --- Ініціалізація змінних ---
let arena = []; // Ігрове поле (сітка)
let score = 0;
let currentPiece = null;
let nextPiece = createPiece(getRandomShapeIndex());

// --- Функції Логіки Гри ---

function createArena(w, h) {
    /** Створює порожню сітку h x w (20x10) */
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function getRandomShapeIndex() {
    /** Повертає випадковий індекс фігури від 1 до 7 */
    return Math.floor(Math.random() * 7) + 1;
}

function createPiece(type) {
    /** Створює об'єкт фігури на основі індексу */
    const matrix = SHAPES[type];
    
    return {
        matrix: matrix,
        pos: { x: Math.floor(COL_COUNT / 2) - 2, y: 0 }, // Центруємо
        color: type 
    };
}

function collide(arena, piece) {
    /** Перевіряє, чи стикається фігура з іншими блоками або краєм поля */
    const m = piece.matrix;
    const o = piece.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && 
               (arena[o.y + y] && arena[o.y + y][o.x + x]) !== 0) {
                return true;
            }
            if (m[y][x] !== 0 && (o.x + x < 0 || o.x + x >= COL_COUNT || o.y + y >= ROW_COUNT)) {
                return true; // Перевірка виходу за межі
            }
        }
    }
    return false;
}

function merge(arena, piece) {
    /** Об'єднує (блокує) фігуру з ігровим полем */
    piece.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                // Використовуємо індекс кольору фігури
                arena[piece.pos.y + y][piece.pos.x + x] = piece.color; 
            }
        });
    });
}

function rotate(matrix, dir) {
    /** Обертає фігуру (матрицю) на 90 градусів */
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            // Транспонування
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse()); // Обертання за годинниковою
    } else {
        matrix.reverse(); // Обертання проти годинникової
    }
}

function pieceRotate() {
    /** Обертає фігуру, перевіряючи колізії (Wall kick) */
    const pos = currentPiece.pos.x;
    let offset = 1;
    rotate(currentPiece.matrix, 1);
    
    // Перевірка колізій і зсув (Wall kick)
    while (collide(arena, currentPiece)) {
        currentPiece.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > currentPiece.matrix.length) {
            rotate(currentPiece.matrix, -1); // Повертаємо, якщо неможливо
            currentPiece.pos.x = pos;
            return;
        }
    }
}

function pieceDrop() {
    /** Рух фігури вниз */
    currentPiece.pos.y++;
    if (collide(arena, currentPiece)) {
        currentPiece.pos.y--;
        merge(arena, currentPiece);
        arenaSweep();
        pieceReset();
    }
}

function pieceMove(dir) {
    /** Рух фігури вліво/вправо */
    currentPiece.pos.x += dir;
    if (collide(arena, currentPiece)) {
        currentPiece.pos.x -= dir;
    }
}

function pieceReset() {
    /** Перехід до наступної фігури */
    currentPiece = nextPiece;
    nextPiece = createPiece(getRandomShapeIndex());
    
    // Перевірка на програш
    if (collide(arena, currentPiece)) {
        arena.forEach(row => row.fill(0)); // Очищаємо поле
        alert('ГРА ЗАКІНЧЕНА! Ваш рахунок: ' + score);
        score = 0;
    }
    updateScore();
}

function arenaSweep() {
    /** Перевірка та видалення заповнених ліній */
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // Лінія не повна, переходимо до наступної
            }
        }

        // Лінія повна, видаляємо її
        const row = arena.splice(y, 1)[0].fill(0); // Видаляємо та створюємо нову порожню
        arena.unshift(row); // Додаємо порожню лінію нагору
        ++y; // Повторюємо перевірку поточної лінії (бо всі змістилися вниз)
        
        // Нарахування очок
        score += rowCount * 10;
        rowCount *= 2;
    }
    updateScore();
}

// --- Функції Відображення (Draw) ---

function drawMatrix(matrix, offset) {
    /** Малює матрицю (фігуру або поле) на canvas */
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect((offset.x + x) * TILE_SIZE,
                                 (offset.y + y) * TILE_SIZE,
                                 TILE_SIZE, TILE_SIZE);
                
                // Додаємо рамку для кращого вигляду
                context.strokeStyle = '#222';
                context.lineWidth = 2;
                context.strokeRect((offset.x + x) * TILE_SIZE,
                                 (offset.y + y) * TILE_SIZE,
                                 TILE_SIZE, TILE_SIZE);
            }
        });
    });
}

function drawNextPiece() {
    /** Малює наступну фігуру в окремому canvas */
    nextContext.fillStyle = '#111';
    nextContext.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // Обчислюємо зміщення для центрування
    const pieceMatrix = nextPiece.matrix;
    const offsetX = (nextCanvas.width / TILE_SIZE - pieceMatrix.length) / 2;
    const offsetY = (nextCanvas.height / TILE_SIZE - pieceMatrix.length) / 2;

    pieceMatrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                nextContext.fillStyle = COLORS[value];
                nextContext.fillRect((offsetX + x) * TILE_SIZE,
                                     (offsetY + y) * TILE_SIZE,
                                     TILE_SIZE, TILE_SIZE);
            }
        });
    });
}

function draw() {
    /** Головна функція малювання */
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);

    drawMatrix(arena, { x: 0, y: 0 }); // Малюємо заблоковані блоки
    
    if (currentPiece) {
        drawMatrix(currentPiece.matrix, currentPiece.pos); // Малюємо поточну фігуру
    }
    
    drawNextPiece();
}

// --- Цикл Анімації та Введення ---

let dropCounter = 0;
let dropInterval = 1000; // Падіння кожну 1 секунду
let lastTime = 0;

function update(time = 0) {
    /** Головний цикл гри, викликається 60 разів на секунду */
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        pieceDrop(); // Автоматичне падіння
        dropCounter = 0;
    }

    draw(); // Перемальовуємо гру
    requestAnimationFrame(update);
}

function updateScore() {
    scoreElement.innerText = score;
}

document.addEventListener('keydown', event => {
    /** Обробка натискань клавіш */
    if (!currentPiece) return;
    
    if (event.key === 'ArrowLeft') {
        pieceMove(-1);
    } else if (event.key === 'ArrowRight') {
        pieceMove(1);
    } else if (event.key === 'ArrowDown') {
        // Прискорене падіння
        pieceDrop();
    } else if (event.key === 'ArrowUp' || event.key === ' ') { 
        // Обертання (стрілка вгору або пробіл)
        pieceRotate();
    }
});

// --- Функція запуску ---
function startGame() {
    if (!currentPiece) {
        arena = createArena(COL_COUNT, ROW_COUNT);
        score = 0;
        currentPiece = createPiece(getRandomShapeIndex());
        nextPiece = createPiece(getRandomShapeIndex());
        updateScore();
        update(); // Запускаємо головний цикл гри
    }
}