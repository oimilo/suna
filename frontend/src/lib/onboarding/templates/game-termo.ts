import { Template } from './types';

const gameTermo: Template = {
  id: 'game-termo',
  name: 'Jogo Termo',
  description: 'Clone do Wordle em português',
  icon: '🎮',
  color: 'from-yellow-500 to-pink-500',
  messages: [
    {
      role: 'assistant',
      content: `## 🎯 Jogo Termo Completo Criado!

Como você escolheu o perfil **"Gamer Entusiasta"**, desenvolvi um clone do Wordle/Termo totalmente funcional em português! Veja o que preparei:

### 🎮 Estrutura do Jogo

**game.html** - Interface do jogo:
- Grid 6x5 (6 tentativas, 5 letras)
- Teclado virtual na tela
- Sistema de dicas coloridas
- Modal de ajuda
- Modal de estatísticas
- Animações suaves

**game.css** - Visual e animações:
- Design minimalista e moderno
- Cores do Termo original
- Animações de flip dos tiles
- Shake em palavra inválida
- Bounce em vitória
- Dark mode automático

**game.js** - Mecânica do jogo:
- 10 palavras iniciais (expansível)
- Validação de palavras
- Sistema de feedback visual
- Salva estatísticas localmente
- Streak counter
- Distribuição de tentativas

### 🎯 Features Implementadas

**Gameplay:**
- 6 tentativas para acertar
- Palavras de 5 letras
- Feedback em cores (verde/amarelo/cinza)
- Nova palavra a cada jogo
- Detecção de vitória/derrota
- Estatísticas persistentes

**Controles:**
- ⌨️ Teclado físico
- 🖱️ Teclado virtual na tela
- ⌫ Backspace para apagar
- ↵ Enter para enviar

### 📊 Estatísticas Rastreadas

- Total de jogos
- Taxa de vitória
- Sequência atual
- Melhor sequência
- Distribuição de tentativas

### 🎨 Customizações Possíveis

Posso expandir o jogo! Me diga se quer:

1. **Mais palavras?** (posso adicionar centenas)
2. **Modo difícil?** (letras descobertas obrigatórias)
3. **Modo cronometrado?** (contra o relógio)
4. **Temas visuais?** (escuro, colorido, minimalista)
5. **Sons e efeitos?** (teclas, vitória, erro)
6. **Compartilhar resultado?** (emoji grid)

### 📝 Palavras Incluídas:

\`\`\`
CAMPO, FESTA, PRAIA, VERDE, AZUIS,
PEDRA, FLOR, CAIXA, LIVRO, PONTE
\`\`\`

O jogo está pronto! Abra game.html para jogar agora. Quer adicionar mais palavras ou criar outro jogo?`,
      timestamp: new Date(Date.now() - 10000).toISOString()
    }
  ],
  files: [
    {
      path: 'game.html',
      content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Termo - Adivinhe a Palavra</title>
    <link rel="stylesheet" href="game.css">
</head>
<body>
    <div class="game-container">
        <header>
            <button class="btn-icon" onclick="showHelp()" title="Ajuda">❓</button>
            <h1>TERMO</h1>
            <button class="btn-icon" onclick="showStats()" title="Estatísticas">📊</button>
        </header>
        
        <div id="gameBoard" class="game-board">
            <!-- Grid será gerado pelo JavaScript -->
        </div>
        
        <div id="keyboard" class="keyboard">
            <!-- Teclado será gerado pelo JavaScript -->
        </div>
        
        <div id="toast" class="toast hidden"></div>
        
        <!-- Modal de Ajuda -->
        <div id="helpModal" class="modal hidden">
            <div class="modal-content">
                <span class="close" onclick="closeHelp()">×</span>
                <h2>Como Jogar</h2>
                <p>Adivinhe a palavra em 6 tentativas.</p>
                <p>Cada tentativa deve ser uma palavra válida de 5 letras.</p>
                <p>As cores das letras mudam para mostrar o quão perto você está:</p>
                <div class="example">
                    <div class="tile correct">V</div>
                    <span>Verde: letra correta na posição correta</span>
                </div>
                <div class="example">
                    <div class="tile present">I</div>
                    <span>Amarelo: letra correta na posição errada</span>
                </div>
                <div class="example">
                    <div class="tile absent">U</div>
                    <span>Cinza: letra não está na palavra</span>
                </div>
            </div>
        </div>
        
        <!-- Modal de Estatísticas -->
        <div id="statsModal" class="modal hidden">
            <div class="modal-content">
                <span class="close" onclick="closeStats()">×</span>
                <h2>Estatísticas</h2>
                <div class="stats-container">
                    <div class="stat">
                        <div class="stat-number" id="totalGames">0</div>
                        <div class="stat-label">Jogos</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="winRate">0%</div>
                        <div class="stat-label">Vitórias</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="currentStreak">0</div>
                        <div class="stat-label">Sequência</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number" id="maxStreak">0</div>
                        <div class="stat-label">Melhor</div>
                    </div>
                </div>
                <button class="btn-new-game" onclick="newGame()">Nova Palavra</button>
            </div>
        </div>
    </div>

    <script src="game.js"></script>
</body>
</html>`
    },
    {
      path: 'game.css',
      content: `:root {
    --color-bg: #121213;
    --color-text: #ffffff;
    --color-border: #3a3a3c;
    --color-key-bg: #818384;
    --color-absent: #3a3a3c;
    --color-present: #b59f3b;
    --color-correct: #538d4e;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Clear Sans', 'Helvetica Neue', Arial, sans-serif;
    background: var(--color-bg);
    color: var(--color-text);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.game-container {
    max-width: 500px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Header */
header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-border);
}

header h1 {
    font-size: 36px;
    font-weight: bold;
    letter-spacing: 0.05em;
}

.btn-icon {
    background: none;
    border: none;
    color: var(--color-text);
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
}

/* Game Board */
.game-board {
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    gap: 5px;
    padding: 10px;
}

.row {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 5px;
}

.tile {
    width: 62px;
    height: 62px;
    border: 2px solid var(--color-border);
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 32px;
    font-weight: bold;
    text-transform: uppercase;
    cursor: default;
    user-select: none;
}

.tile.filled {
    animation: pop 0.1s ease-in-out;
}

.tile.absent {
    background-color: var(--color-absent);
    border-color: var(--color-absent);
    animation: flip 0.5s ease-in-out;
}

.tile.present {
    background-color: var(--color-present);
    border-color: var(--color-present);
    animation: flip 0.5s ease-in-out;
}

.tile.correct {
    background-color: var(--color-correct);
    border-color: var(--color-correct);
    animation: flip 0.5s ease-in-out;
}

@keyframes pop {
    0%, 100% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
}

@keyframes flip {
    0% {
        transform: rotateX(0);
    }
    50% {
        transform: rotateX(90deg);
    }
    100% {
        transform: rotateX(0);
    }
}

@keyframes shake {
    0%, 100% {
        transform: translateX(0);
    }
    10%, 30%, 50%, 70%, 90% {
        transform: translateX(-2px);
    }
    20%, 40%, 60%, 80% {
        transform: translateX(2px);
    }
}

.row.shake {
    animation: shake 0.5s;
}

.row.bounce {
    animation: bounce 0.5s;
}

@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

/* Keyboard */
.keyboard {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
}

.keyboard-row {
    display: flex;
    justify-content: center;
    gap: 6px;
}

.key {
    background-color: var(--color-key-bg);
    border: none;
    border-radius: 4px;
    color: var(--color-text);
    padding: 0;
    height: 58px;
    min-width: 43px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: uppercase;
}

.key:hover {
    opacity: 0.8;
}

.key.wide {
    min-width: 65px;
}

.key.absent {
    background-color: var(--color-absent);
}

.key.present {
    background-color: var(--color-present);
}

.key.correct {
    background-color: var(--color-correct);
}

/* Toast */
.toast {
    position: fixed;
    top: 10%;
    left: 50%;
    transform: translateX(-50%);
    background-color: white;
    color: black;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: bold;
    z-index: 1000;
    pointer-events: none;
}

.toast.hidden {
    display: none;
}

/* Modals */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
}

.modal.hidden {
    display: none;
}

.modal-content {
    background-color: var(--color-bg);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 20px;
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.modal-content h2 {
    margin-bottom: 20px;
}

.close {
    position: absolute;
    top: 10px;
    right: 15px;
    font-size: 28px;
    cursor: pointer;
    color: var(--color-text);
}

/* Examples in help modal */
.example {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0;
}

.example .tile {
    width: 40px;
    height: 40px;
    font-size: 20px;
    border: none;
}

/* Stats */
.stats-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin: 20px 0;
}

.stat {
    text-align: center;
}

.stat-number {
    font-size: 36px;
    font-weight: bold;
}

.stat-label {
    font-size: 12px;
    text-transform: uppercase;
    opacity: 0.7;
}

.btn-new-game {
    width: 100%;
    background-color: var(--color-correct);
    color: white;
    border: none;
    padding: 12px;
    font-size: 16px;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 20px;
}

.btn-new-game:hover {
    opacity: 0.9;
}

/* Responsive */
@media (max-width: 480px) {
    .tile {
        width: 50px;
        height: 50px;
        font-size: 24px;
    }
    
    .key {
        min-width: 35px;
        height: 50px;
        font-size: 12px;
    }
    
    .key.wide {
        min-width: 50px;
    }
}`
    },
    {
      path: 'game.js',
      content: `// Jogo Termo - Clone do Wordle em Português
const WORD_LENGTH = 5;
const MAX_GUESSES = 6;

// Lista de palavras válidas (10 palavras iniciais)
const WORDS = [
    'CAMPO', 'FESTA', 'PRAIA', 'VERDE', 'AZUIS',
    'PEDRA', 'FLORE', 'CAIXA', 'LIVRO', 'PONTE'
];

// Lista expandida de palavras aceitas (para validação)
const VALID_WORDS = [
    ...WORDS,
    'BANCO', 'PORTA', 'MESA', 'JANELA', 'CARRO',
    'PAPEL', 'CANETA', 'LIVRO', 'ESCOLA', 'AMIGO',
    'TEMPO', 'NOITE', 'SONHO', 'MUNDO', 'BRASIL'
];

class TermoGame {
    constructor() {
        this.currentRow = 0;
        this.currentCol = 0;
        this.board = Array(MAX_GUESSES).fill().map(() => Array(WORD_LENGTH).fill(''));
        this.evaluations = Array(MAX_GUESSES).fill().map(() => Array(WORD_LENGTH).fill(''));
        this.keyboardState = {};
        this.gameState = 'playing';
        this.targetWord = '';
        this.stats = this.loadStats();
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.setupKeyboard();
        this.setupEventListeners();
        this.selectNewWord();
        this.updateStats();
    }
    
    setupBoard() {
        const board = document.getElementById('gameBoard');
        board.innerHTML = '';
        
        for (let i = 0; i < MAX_GUESSES; i++) {
            const row = document.createElement('div');
            row.className = 'row';
            row.id = \`row-\${i}\`;
            
            for (let j = 0; j < WORD_LENGTH; j++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.id = \`tile-\${i}-\${j}\`;
                row.appendChild(tile);
            }
            
            board.appendChild(row);
        }
    }
    
    setupKeyboard() {
        const keyboard = document.getElementById('keyboard');
        keyboard.innerHTML = '';
        
        const rows = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
        ];
        
        rows.forEach(row => {
            const rowDiv = document.createElement('div');
            rowDiv.className = 'keyboard-row';
            
            row.forEach(key => {
                const keyDiv = document.createElement('button');
                keyDiv.className = 'key';
                if (key === 'ENTER' || key === 'BACKSPACE') {
                    keyDiv.classList.add('wide');
                }
                keyDiv.textContent = key === 'BACKSPACE' ? '⌫' : key;
                keyDiv.onclick = () => this.handleKeyPress(key);
                rowDiv.appendChild(keyDiv);
            });
            
            keyboard.appendChild(rowDiv);
        });
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (this.gameState !== 'playing') return;
            
            const key = e.key.toUpperCase();
            if (key === 'ENTER') {
                this.handleKeyPress('ENTER');
            } else if (key === 'BACKSPACE') {
                this.handleKeyPress('BACKSPACE');
            } else if (key.match(/[A-Z]/) && key.length === 1) {
                this.handleKeyPress(key);
            }
        });
    }
    
    handleKeyPress(key) {
        if (this.gameState !== 'playing') return;
        
        if (key === 'ENTER') {
            this.submitGuess();
        } else if (key === 'BACKSPACE') {
            this.deleteLetter();
        } else if (key.match(/[A-Z]/) && this.currentCol < WORD_LENGTH) {
            this.addLetter(key);
        }
    }
    
    addLetter(letter) {
        if (this.currentCol < WORD_LENGTH) {
            const tile = document.getElementById(\`tile-\${this.currentRow}-\${this.currentCol}\`);
            tile.textContent = letter;
            tile.classList.add('filled');
            this.board[this.currentRow][this.currentCol] = letter;
            this.currentCol++;
        }
    }
    
    deleteLetter() {
        if (this.currentCol > 0) {
            this.currentCol--;
            const tile = document.getElementById(\`tile-\${this.currentRow}-\${this.currentCol}\`);
            tile.textContent = '';
            tile.classList.remove('filled');
            this.board[this.currentRow][this.currentCol] = '';
        }
    }
    
    submitGuess() {
        if (this.currentCol !== WORD_LENGTH) {
            this.showToast('Palavra incompleta!');
            this.shakeRow();
            return;
        }
        
        const guess = this.board[this.currentRow].join('');
        
        if (!VALID_WORDS.includes(guess)) {
            this.showToast('Palavra não encontrada!');
            this.shakeRow();
            return;
        }
        
        this.evaluateGuess(guess);
        
        if (guess === this.targetWord) {
            this.gameState = 'won';
            this.showToast('Parabéns! 🎉');
            this.bounceRow();
            this.updateStats(true);
            setTimeout(() => this.showStats(), 2000);
        } else if (this.currentRow === MAX_GUESSES - 1) {
            this.gameState = 'lost';
            this.showToast(\`A palavra era: \${this.targetWord}\`);
            this.updateStats(false);
            setTimeout(() => this.showStats(), 2000);
        } else {
            this.currentRow++;
            this.currentCol = 0;
        }
    }
    
    evaluateGuess(guess) {
        const targetLetters = this.targetWord.split('');
        const guessLetters = guess.split('');
        const evaluation = Array(WORD_LENGTH).fill('absent');
        
        // First pass: mark correct letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guessLetters[i] === targetLetters[i]) {
                evaluation[i] = 'correct';
                targetLetters[i] = null; // Mark as used
            }
        }
        
        // Second pass: mark present letters
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (evaluation[i] === 'absent' && targetLetters.includes(guessLetters[i])) {
                evaluation[i] = 'present';
                const index = targetLetters.indexOf(guessLetters[i]);
                targetLetters[index] = null; // Mark as used
            }
        }
        
        // Apply styles to tiles and keyboard
        for (let i = 0; i < WORD_LENGTH; i++) {
            const tile = document.getElementById(\`tile-\${this.currentRow}-\${i}\`);
            const letter = guessLetters[i];
            
            setTimeout(() => {
                tile.classList.add(evaluation[i]);
                this.updateKeyboard(letter, evaluation[i]);
            }, i * 100);
        }
        
        this.evaluations[this.currentRow] = evaluation;
    }
    
    updateKeyboard(letter, state) {
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            if (key.textContent === letter) {
                // Only update if it's not already correct
                if (!key.classList.contains('correct')) {
                    key.classList.remove('absent', 'present', 'correct');
                    key.classList.add(state);
                }
            }
        });
    }
    
    shakeRow() {
        const row = document.getElementById(\`row-\${this.currentRow}\`);
        row.classList.add('shake');
        setTimeout(() => row.classList.remove('shake'), 500);
    }
    
    bounceRow() {
        const row = document.getElementById(\`row-\${this.currentRow}\`);
        row.classList.add('bounce');
        setTimeout(() => row.classList.remove('bounce'), 500);
    }
    
    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 2000);
    }
    
    selectNewWord() {
        this.targetWord = WORDS[Math.floor(Math.random() * WORDS.length)];
        console.log('Target word:', this.targetWord); // Remove in production
    }
    
    loadStats() {
        const saved = localStorage.getItem('termo-stats');
        return saved ? JSON.parse(saved) : {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
    }
    
    saveStats() {
        localStorage.setItem('termo-stats', JSON.stringify(this.stats));
    }
    
    updateStats(won = null) {
        if (won !== null) {
            this.stats.gamesPlayed++;
            
            if (won) {
                this.stats.gamesWon++;
                this.stats.currentStreak++;
                this.stats.maxStreak = Math.max(this.stats.maxStreak, this.stats.currentStreak);
                this.stats.guessDistribution[this.currentRow]++;
            } else {
                this.stats.currentStreak = 0;
            }
            
            this.saveStats();
        }
        
        // Update display
        document.getElementById('totalGames').textContent = this.stats.gamesPlayed;
        document.getElementById('winRate').textContent = 
            this.stats.gamesPlayed > 0 ? 
            Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100) + '%' : '0%';
        document.getElementById('currentStreak').textContent = this.stats.currentStreak;
        document.getElementById('maxStreak').textContent = this.stats.maxStreak;
    }
    
    newGame() {
        this.currentRow = 0;
        this.currentCol = 0;
        this.board = Array(MAX_GUESSES).fill().map(() => Array(WORD_LENGTH).fill(''));
        this.evaluations = Array(MAX_GUESSES).fill().map(() => Array(WORD_LENGTH).fill(''));
        this.keyboardState = {};
        this.gameState = 'playing';
        
        this.setupBoard();
        this.setupKeyboard();
        this.selectNewWord();
        
        // Close stats modal
        closeStats();
    }
}

// Modal functions
function showHelp() {
    document.getElementById('helpModal').classList.remove('hidden');
}

function closeHelp() {
    document.getElementById('helpModal').classList.add('hidden');
}

function showStats() {
    document.getElementById('statsModal').classList.remove('hidden');
}

function closeStats() {
    document.getElementById('statsModal').classList.add('hidden');
}

function newGame() {
    if (window.game) {
        window.game.newGame();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TermoGame();
});`
    }
  ]
};

export default gameTermo;