// 게임 상태 변수
const gameState = {
    currentLevel: 1,
    maxLevel: 5,
    timeRemaining: 300, // 5분 (초 단위)
    batteryLevel: 100, // 배터리 레벨(100%에서 시작)
    timerInterval: null,
    isGameOver: false,
    finalCode: "1339" // 질병관리청 콜센터 번호
};

// 레벨별 퍼즐 및 정답 데이터
const levels = [
    {
        level: 1,
        description: "첫 번째 백신 코드를 해독하세요: 호흡기 감염병 예방을 위한 가장 기본적인 보호구는?",
        puzzle: createMaskingPuzzle(),
        answer: "마스크",
        wrongPenalty: 10 // 배터리 감소 패널티
    },
    {
        level: 2,
        description: "두 번째 백신 코드: 올바른 손 씻기 시간은 최소 몇 초인가요? (숫자만 입력)",
        puzzle: createNumberGridPuzzle(),
        answer: "20",
        wrongPenalty: 15
    },
    {
        level: 3,
        description: "세 번째 백신 코드: 다음 중 호흡기 감염병이 아닌 것을 골라 답을 쓰세요.",
        puzzle: createRespiratoryPuzzle(),
        answer: "노로바이러스",
        wrongPenalty: 20
    },
    {
        level: 4,
        description: "네 번째 백신 코드: 인플루엔자(독감) 환자의 등교중지 기간은 해열제 복용 없이도 해열된 후 몇 시간까지인가요? (숫자만 입력)",
        puzzle: createInfluenzaPuzzle(),
        answer: "24",
        wrongPenalty: 25
    },
    {
        level: 5,
        description: "마지막 백신 코드: 백신이 작동하는 원리와 관련된 키워드를 찾아 입력하세요.",
        puzzle: createFinalPuzzle(),
        answer: "항체",
        wrongPenalty: 30
    }
];

// 오디오 요소 생성
const explosionSound = new Audio('https://soundbible.com/mp3/Bomb_Exploding-Sound_Explorer-68256487.mp3'); // 더 강력한 폭발 사운드
const successSound = new Audio('https://soundbible.com/grab.php?id=1700&type=mp3'); // 성공 사운드
const backgroundMusic = new Audio('https://soundbible.com/mp3/suspense-thriller-1-16896.mp3'); // 긴장감 있는 배경음악
const correctAnswerSound = new Audio('https://soundbible.com/mp3/SMALL_CROWD_APPLAUSE-Yannick_Lemieux-1268806408.mp3'); // 박수 소리
const wrongAnswerSound = new Audio('https://soundbible.com/mp3/Sad_Trombone-Joe_Lamb-665429450.mp3'); // 실망 효과음

// 배경음악 설정
backgroundMusic.loop = true;
backgroundMusic.volume = 0.3;

// 효과음 볼륨 설정
correctAnswerSound.volume = 0.6;
wrongAnswerSound.volume = 0.6;

// DOM 요소
const startScreen = document.getElementById('start-screen');
const gameLevel = document.getElementById('game-level');
const gameOver = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const puzzleContainer = document.getElementById('puzzle-container');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const currentLevelElement = document.getElementById('current-level');
const levelDescription = document.getElementById('level-description');
const timerElement = document.getElementById('timer');
const batteryElement = document.getElementById('battery-level');
const batteryBarElement = document.getElementById('battery-bar');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMessage = document.getElementById('game-over-message');
const restartButton = document.getElementById('restart-button');

// 이벤트 리스너 설정
startButton.addEventListener('click', startGame);
submitButton.addEventListener('click', checkAnswer);
restartButton.addEventListener('click', resetGame);
answerInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkAnswer();
    }
});

// 게임 시작 함수
function startGame() {
    startScreen.style.display = 'none';
    gameLevel.style.display = 'block';
    gameOver.style.display = 'none';
    
    gameState.currentLevel = 1;
    gameState.timeRemaining = 300;
    gameState.batteryLevel = 100;
    gameState.isGameOver = false;
    
    updateTimer();
    updateBatteryLevel();
    loadLevel(gameState.currentLevel);
    
    // 배경음악 시작
    backgroundMusic.play().catch(e => console.log('배경음악 재생 실패:', e));
    
    // 타이머 시작
    startTimer();
}

// 타이머 시작 함수
function startTimer() {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = setInterval(() => {
        gameState.timeRemaining--;
        updateTimer();
        
        if (gameState.timeRemaining <= 0 || gameState.batteryLevel <= 0) {
            endGame(false);
        }
    }, 1000);
}

// 타이머 업데이트 함수
function updateTimer() {
    const minutes = Math.floor(gameState.timeRemaining / 60);
    const seconds = gameState.timeRemaining % 60;
    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    // 타이머가 1분 이하면 색상 변경
    if (gameState.timeRemaining <= 60) {
        timerElement.style.color = '#ff0000';
        timerElement.style.fontWeight = 'bold';
    } else {
        timerElement.style.color = '#ff5252';
        timerElement.style.fontWeight = 'normal';
    }
}

// 배터리 레벨 업데이트 함수
function updateBatteryLevel() {
    batteryBarElement.style.width = `${gameState.batteryLevel}%`;
    
    // 배터리 레벨에 따른 색상 변경
    if (gameState.batteryLevel <= 25) {
        batteryBarElement.style.backgroundColor = '#ff0000';
    } else if (gameState.batteryLevel <= 50) {
        batteryBarElement.style.backgroundColor = '#ffa500';
    } else {
        batteryBarElement.style.backgroundColor = '#00c896';
    }
}

// 레벨 로드 함수
function loadLevel(levelNumber) {
    const level = levels[levelNumber - 1];
    currentLevelElement.textContent = levelNumber;
    levelDescription.textContent = level.description;
    
    // 퍼즐 컨테이너 초기화
    puzzleContainer.innerHTML = '';
    puzzleContainer.appendChild(level.puzzle);
    
    // 입력 필드 초기화
    answerInput.value = '';
    
    // 레벨에 따른 배경 효과 설정
    document.body.style.setProperty('--battery-level', `${gameState.batteryLevel}%`);
}

// 정답 확인 함수
function checkAnswer() {
    const userAnswer = answerInput.value.trim().toLowerCase();
    const currentLevel = levels[gameState.currentLevel - 1];
    
    // 기존 피드백 제거
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }
    
    // 피드백 요소 생성
    const feedback = document.createElement('div');
    feedback.classList.add('feedback');
    
    if (userAnswer === currentLevel.answer.toLowerCase()) {
        // 정답인 경우
        correctAnswerSound.play().catch(e => console.log('정답 효과음 재생 실패:', e));
        
        feedback.classList.add('correct');
        feedback.textContent = '정답입니다! 백신 코드가 해제되었습니다.';
        puzzleContainer.appendChild(feedback);
        
        // 다음 레벨로 진행 또는 게임 종료
        setTimeout(() => {
            if (gameState.currentLevel < gameState.maxLevel) {
                gameState.currentLevel++;
                loadLevel(gameState.currentLevel);
            } else {
                // 모든 레벨 완료 - 폭탄 해제 단계로 진행
                loadBombDefuseStage();
            }
        }, 1500);
    } else {
        // 오답인 경우
        wrongAnswerSound.play().catch(e => console.log('오답 효과음 재생 실패:', e));
        
        feedback.classList.add('wrong');
        feedback.textContent = '오답입니다! 배터리가 소모되었습니다.';
        puzzleContainer.appendChild(feedback);
        
        // 페널티 적용
        gameState.batteryLevel -= currentLevel.wrongPenalty;
        if (gameState.batteryLevel < 0) gameState.batteryLevel = 0;
        updateBatteryLevel();
        createVirusAnimation();
        
        // 타이머 감소 페널티 (레벨이 높을수록 더 많이 감소)
        const timerPenalty = 5 * gameState.currentLevel;
        gameState.timeRemaining -= timerPenalty;
        if (gameState.timeRemaining < 0) gameState.timeRemaining = 0;
        updateTimer();
        
        // 게임 오버 체크
        if (gameState.batteryLevel <= 0) {
            endGame(false);
        }
    }
}

// 폭탄 해제 단계 로드 함수
function loadBombDefuseStage() {
    // 퍼즐 컨테이너 초기화
    puzzleContainer.innerHTML = '';
    
    // 레벨 정보 업데이트
    currentLevelElement.textContent = '최종';
    levelDescription.textContent = '폭탄 해제 코드를 입력하세요.';
    
    // 폭탄 이미지 생성
    const bombContainer = document.createElement('div');
    bombContainer.classList.add('bomb-container');
    
    const bombImage = document.createElement('div');
    bombImage.classList.add('bomb-image');
    bombImage.innerHTML = '💣';
    bombImage.style.fontSize = '80px';
    bombImage.style.marginBottom = '20px';
    bombContainer.appendChild(bombImage);
    
    // 폭탄 타이머 및 코드 정보 표시
    const bombInfo = document.createElement('div');
    bombInfo.classList.add('bomb-info');
    bombInfo.innerHTML = `
        <p>최종 폭탄 해제 코드를 찾아야 합니다!</p>
        <p style="font-size: 1.2rem; color: #00ffc8; margin: 15px 0;">질병관리청 콜센터 번호는?</p>
        <p>암호를 풀어 폭탄을 해제하세요.</p>
    `;
    bombContainer.appendChild(bombInfo);
    
    // 코드 입력 필드
    const codeInputContainer = document.createElement('div');
    codeInputContainer.classList.add('code-input-container');
    
    // 4자리 코드 입력 필드 생성
    for (let i = 0; i < 4; i++) {
        const digitInput = document.createElement('input');
        digitInput.type = 'text';
        digitInput.maxLength = 1;
        digitInput.classList.add('code-digit');
        digitInput.dataset.position = i;
        
        // 숫자만 입력 가능하도록 제한
        digitInput.addEventListener('keypress', function(e) {
            if (!/^\d$/.test(e.key)) {
                e.preventDefault();
            }
        });
        
        // 입력 후 자동으로 다음 필드로 이동
        digitInput.addEventListener('input', function() {
            if (this.value && i < 3) {
                document.querySelectorAll('.code-digit')[i + 1].focus();
            }
        });
        
        codeInputContainer.appendChild(digitInput);
    }
    
    bombContainer.appendChild(codeInputContainer);
    
    // 폭탄 해제 버튼
    const defuseButton = document.createElement('button');
    defuseButton.textContent = '폭탄 해제';
    defuseButton.classList.add('defuse-button');
    defuseButton.addEventListener('click', checkDefuseCode);
    bombContainer.appendChild(defuseButton);
    
    puzzleContainer.appendChild(bombContainer);
    
    // 첫 번째 입력 필드에 포커스
    setTimeout(() => {
        document.querySelector('.code-digit').focus();
    }, 100);
}

// 폭탄 해제 코드 확인
function checkDefuseCode() {
    const codeDigits = document.querySelectorAll('.code-digit');
    let userCode = '';
    
    // 사용자 입력 코드 가져오기
    codeDigits.forEach(digit => {
        userCode += digit.value;
    });
    
    if (userCode === gameState.finalCode) {
        // 폭탄 해제 성공
        successSound.play().catch(e => console.log('성공 효과음 재생 실패:', e));
        endGame(true);
    } else {
        // 폭탄 해제 실패
        explosionSound.play().catch(e => console.log('폭발 효과음 재생 실패:', e));
        
        // 폭발 애니메이션
        const bombImage = document.querySelector('.bomb-image');
        bombImage.innerHTML = '💥';
        bombImage.style.fontSize = '100px';
        bombImage.classList.add('explode');
        
        // 게임 오버
        setTimeout(() => {
            endGame(false, true);
        }, 1500);
    }
}

// 게임 종료 함수
function endGame(isSuccess, isBombExploded = false) {
    clearInterval(gameState.timerInterval);
    gameState.isGameOver = true;
    
    // 배경음악 정지
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    
    gameLevel.style.display = 'none';
    gameOver.style.display = 'block';
    
    if (isSuccess) {
        successSound.play().catch(e => console.log('성공 효과음 재생 실패:', e));
        gameOverTitle.textContent = '축하합니다!';
        gameOverTitle.style.color = '#00ffc8';
        gameOverMessage.textContent = '폭탄을 성공적으로 해제했습니다. 인류는 당신 덕분에 구원받았습니다!';
        gameOverMessage.style.color = '#00ffc8';
    } else {
        if (isBombExploded) {
            gameOverTitle.textContent = '폭탄 폭발!';
            gameOverMessage.textContent = '잘못된 코드를 입력하여 폭탄이 폭발했습니다. 인류는 위험에 빠졌습니다.';
        } else if (gameState.batteryLevel <= 0) {
            gameOverTitle.textContent = '게임 오버';
            gameOverMessage.textContent = '배터리가 모두 소진되었습니다. 백신 알고리즘을 찾는데 실패했습니다.';
        } else {
            gameOverTitle.textContent = '게임 오버';
            gameOverMessage.textContent = '시간이 다 되었습니다. 인류는 감염병으로부터 구해지지 못했습니다.';
        }
        
        if (!isBombExploded) {
            explosionSound.play().catch(e => console.log('폭발 효과음 재생 실패:', e));
        }
    }
}

// 게임 리셋 함수
function resetGame() {
    gameOver.style.display = 'none';
    startScreen.style.display = 'block';
    
    // 배경음악 정지
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

// 바이러스 애니메이션 생성 함수
function createVirusAnimation() {
    const gameContainer = document.querySelector('.game-container');
    
    for (let i = 0; i < 5; i++) {
        const virus = document.createElement('div');
        virus.classList.add('virus-icon');
        virus.innerHTML = '🦠';
        
        // 랜덤 위치 및 움직임 설정
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        const moveX = (Math.random() - 0.5) * 200;
        const moveY = (Math.random() - 0.5) * 200;
        
        virus.style.setProperty('--x', `${moveX}px`);
        virus.style.setProperty('--y', `${moveY}px`);
        virus.style.left = `${startX}%`;
        virus.style.top = `${startY}%`;
        
        gameContainer.appendChild(virus);
        
        // 애니메이션 완료 후 제거
        setTimeout(() => {
            virus.remove();
        }, 3000);
    }
}

// 레벨 1: 마스크 퍼즐 생성
function createMaskingPuzzle() {
    const container = document.createElement('div');
    
    const puzzleText = document.createElement('p');
    puzzleText.innerHTML = '호흡기 감염병 예방을 위해 <span style="color:#00ffc8">□□□</span>를 착용하는 것이 효과적입니다.<br>올바른 착용 방법은 코와 입을 모두 가리는 것입니다.';
    container.appendChild(puzzleText);
    
    const maskImage = document.createElement('img');
    maskImage.src = 'https://www.cdc.gov/coronavirus/2019-ncov/images/your-health/howWearMask.webp';
    maskImage.alt = '올바른 마스크 착용법';
    maskImage.style.width = '200px';
    maskImage.style.marginTop = '20px';
    maskImage.style.borderRadius = '5px';
    container.appendChild(maskImage);
    
    return container;
}

// 레벨 2: 숫자 그리드 퍼즐 생성
function createNumberGridPuzzle() {
    const container = document.createElement('div');
    
    const puzzleText = document.createElement('p');
    puzzleText.innerHTML = '올바른 손 씻기는 감염병 예방에 중요합니다.<br>비누와 물로 <span style="color:#00ffc8">□□</span>초 이상 손을 씻어야 합니다.<br>아래 숫자 중 정답을 찾으세요:';
    container.appendChild(puzzleText);
    
    const grid = document.createElement('div');
    grid.classList.add('code-grid');
    
    const numbers = [5, 10, 15, 20, 25, 30, 35, 40];
    // 숫자 섞기
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    numbers.forEach(num => {
        const cell = document.createElement('div');
        cell.classList.add('code-cell');
        cell.textContent = num;
        
        cell.addEventListener('click', () => {
            // 선택된 다른 셀이 있으면 선택 해제
            document.querySelectorAll('.code-cell.selected').forEach(selected => {
                selected.classList.remove('selected');
            });
            
            // 현재 셀 선택
            cell.classList.add('selected');
            answerInput.value = num;
        });
        
        grid.appendChild(cell);
    });
    
    container.appendChild(grid);
    
    const handwashImage = document.createElement('img');
    handwashImage.src = 'https://www.cdc.gov/handwashing/images/steps/wash-your-hands-steps-6-md.jpg';
    handwashImage.alt = '올바른 손 씻기';
    handwashImage.style.width = '250px';
    handwashImage.style.marginTop = '20px';
    handwashImage.style.borderRadius = '5px';
    container.appendChild(handwashImage);
    
    return container;
}

// 레벨 3: 호흡기 감염병 퍼즐 생성
function createRespiratoryPuzzle() {
    const container = document.createElement('div');
    
    const puzzleText = document.createElement('p');
    puzzleText.innerHTML = '다음 중 호흡기 감염병이 <strong>아닌</strong> 것을 골라 답을 쓰세요:';
    container.appendChild(puzzleText);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.style.margin = '20px auto';
    optionsContainer.style.maxWidth = '400px';
    
    const options = [
        '1. 인플루엔자 (독감)',
        '2. 코로나19',
        '3. 유행성이하선염 (볼거리)',
        '4. 노로바이러스'
    ];
    
    options.forEach(option => {
        const optionDiv = document.createElement('div');
        optionDiv.classList.add('disease-option');
        optionDiv.innerHTML = option;
        optionDiv.style.padding = '10px';
        optionDiv.style.margin = '8px 0';
        optionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        optionDiv.style.borderRadius = '5px';
        optionDiv.style.cursor = 'pointer';
        
        optionDiv.addEventListener('click', () => {
            // 다른 선택지 선택 해제
            document.querySelectorAll('.disease-option.selected').forEach(selected => {
                selected.classList.remove('selected');
                selected.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            });
            
            // 현재 선택지 선택
            optionDiv.classList.add('selected');
            optionDiv.style.backgroundColor = 'rgba(0, 255, 200, 0.2)';
            
            // 입력창에 선택한 질병명 표시
            if (option.includes('노로바이러스')) {
                answerInput.value = '노로바이러스';
            } else if (option.includes('인플루엔자')) {
                answerInput.value = '인플루엔자';
            } else if (option.includes('코로나19')) {
                answerInput.value = '코로나19';
            } else if (option.includes('유행성이하선염')) {
                answerInput.value = '유행성이하선염';
            }
        });
        
        optionsContainer.appendChild(optionDiv);
    });
    
    container.appendChild(optionsContainer);
    
    const infoText = document.createElement('p');
    infoText.style.marginTop = '20px';
    infoText.style.fontSize = '0.9em';
    infoText.style.color = '#aaa';
    infoText.innerHTML = '* 호흡기 감염병은 주로 호흡기를 통해 전파되는 질병입니다.';
    container.appendChild(infoText);
    
    // 정답 입력 안내 문구 추가
    const answerGuide = document.createElement('p');
    answerGuide.style.marginTop = '20px';
    answerGuide.style.fontWeight = 'bold';
    answerGuide.style.color = '#ff5252';
    answerGuide.innerHTML = '정답을 클릭하세요';
    container.appendChild(answerGuide);
    
    return container;
}

// 레벨 4: 인플루엔자 격리 기간 퍼즐 생성
function createInfluenzaPuzzle() {
    const container = document.createElement('div');
    
    const puzzleText = document.createElement('p');
    puzzleText.innerHTML = '인플루엔자(독감) 환자의 등교중지 기간에 대한 지침입니다.<br><br>' +
        '<strong>독감 환자는 해열제 복용 없이도 해열된 후 <span style="color:#00ffc8">□□</span>시간이 경과될 때까지 등교를 중지</strong>해야 합니다.<br><br>' +
        '독감은 발열이 없어진 후에도 바이러스 전파가 가능하므로 적절한 등교중지 기간 준수가 중요합니다.<br><br>' +
        '몇 시간일까요? (숫자만 입력)';
    
    container.appendChild(puzzleText);
    
    // 독감 관련 아이콘 추가
    const feverIcon = document.createElement('div');
    feverIcon.innerHTML = '🤒';
    feverIcon.style.fontSize = '50px';
    feverIcon.style.margin = '15px 0';
    container.appendChild(feverIcon);
    
    return container;
}

// 레벨 5: 최종 퍼즐 생성
function createFinalPuzzle() {
    const container = document.createElement('div');
    
    const puzzleText = document.createElement('p');
    puzzleText.innerHTML = '백신의 원리를 이해하면 최종 코드를 해독할 수 있습니다.<br>아래 그림을 보고 백신의 작동 원리와 관련된 핵심 단어를 입력하세요:';
    container.appendChild(puzzleText);
    
    const cluesContainer = document.createElement('div');
    cluesContainer.style.backgroundColor = 'rgba(0,0,0,0.2)';
    cluesContainer.style.padding = '15px';
    cluesContainer.style.borderRadius = '5px';
    cluesContainer.style.margin = '20px 0';
    
    const vaccineInfo = document.createElement('p');
    vaccineInfo.innerHTML = `
        백신 작동 원리:<br>
        1. 약화된 병원체나 병원체의 일부를 주입<br>
        2. 면역계가 이를 외부 침입자로 인식<br>
        3. 면역계가 <span style="color:#00ffc8">□□</span>를 생성하여 대응<br>
        4. 면역 기억이 형성되어 실제 감염 시 신속하게 대응
    `;
    cluesContainer.appendChild(vaccineInfo);
    
    const vaccineImage = document.createElement('img');
    vaccineImage.src = 'https://www.cdc.gov/vaccines/vac-gen/images/how-vaccines-work.jpg';
    vaccineImage.alt = '백신 작동 원리';
    vaccineImage.style.width = '280px';
    vaccineImage.style.borderRadius = '5px';
    vaccineImage.style.marginTop = '15px';
    cluesContainer.appendChild(vaccineImage);
    
    container.appendChild(cluesContainer);
    
    return container;
}

// 게임 시작 화면 초기화
window.onload = function() {
    startScreen.style.display = 'block';
    gameLevel.style.display = 'none';
    gameOver.style.display = 'none';
    
    // 오디오 요소 미리 로드
    explosionSound.load();
    successSound.load();
    backgroundMusic.load();
    correctAnswerSound.load();
    wrongAnswerSound.load();
    
    // 모바일에서 오디오 재생을 위한 사용자 상호작용 처리
    document.body.addEventListener('click', function() {
        // 음소거 상태에서 잠시 재생했다가 다시 정지하여 오디오 컨텍스트 활성화
        if (backgroundMusic.paused) {
            backgroundMusic.play().then(() => {
                if (!gameState.currentLevel) { // 게임이 시작되지 않은 상태라면
                    backgroundMusic.pause();
                    backgroundMusic.currentTime = 0;
                }
            }).catch(e => console.log('배경음악 초기화 실패:', e));
        }
    }, {once: true});
}; 