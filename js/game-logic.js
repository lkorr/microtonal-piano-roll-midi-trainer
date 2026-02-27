// Game Logic - Question generation, validation, and game flow

class GameLogic {
    constructor() {
        this.config = null;
        this.pianoRoll = null;

        this.currentQuestion = 0;
        this.score = {
            correct: 0,
            total: 0,
            times: []
        };

        this.questionStartTime = null;
        this.totalStartTime = null;

        // UI elements
        this.questionCounter = document.getElementById('question-counter');
        this.currentTaskDisplay = document.getElementById('current-task');
        this.totalTimer = document.getElementById('total-timer');
        this.avgTimer = document.getElementById('avg-timer');
        this.submitBtn = document.getElementById('submit-btn');
        this.quitBtn = document.getElementById('quit-btn');
        this.feedbackOverlay = document.getElementById('feedback-overlay');

        // Interval for updating timer
        this.timerInterval = null;

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.submitBtn.addEventListener('click', () => this.submitAnswer());
        this.quitBtn.addEventListener('click', () => this.quit());

        // Enter key to submit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !this.submitBtn.disabled) {
                this.submitAnswer();
            }
        });
    }

    /**
     * Start game with configuration
     */
    start(config) {
        this.config = config;
        this.currentQuestion = 0;
        this.score = {
            correct: 0,
            total: 0,
            times: []
        };

        // Initialize audio engine
        audioEngine.init(config.synthType, config.edo);
        audioEngine.resume();

        // Initialize piano roll
        if (!this.pianoRoll) {
            this.pianoRoll = new PianoRoll('piano-roll', 127);
        }

        this.pianoRoll.init(config.edo);

        // Set custom labels if provided
        if (config.customLabels && config.customLabels.length > 0) {
            this.pianoRoll.setCustomLabels(config.customLabels);
        }

        // Set whether to use custom labels
        this.pianoRoll.useCustomLabels = config.useCustomLabels || false;

        // Setup piano roll callback
        this.pianoRoll.onNoteClick = (step, userNotes) => {
            this.updateSubmitButton(userNotes);
        };

        // Start first question
        this.totalStartTime = Date.now();
        this.startTimer();
        this.nextQuestion();
    }

    /**
     * Generate and display next question
     */
    nextQuestion() {
        if (this.currentQuestion >= this.config.questionCount) {
            this.endGame();
            return;
        }

        this.currentQuestion++;
        this.pianoRoll.reset();

        // Update question counter
        this.questionCounter.textContent = `Question ${this.currentQuestion}/${this.config.questionCount}`;

        // Generate question based on mode
        if (this.config.mode === 'edo-steps') {
            this.generateEDOStepsQuestion();
        } else if (this.config.mode === 'ratio') {
            this.generateRatioQuestion();
        } else if (this.config.mode === 'chord') {
            this.generateChordQuestion();
        }

        // Disable submit button until user places notes
        this.submitBtn.disabled = true;
        this.questionStartTime = Date.now();
    }

    /**
     * Generate EDO steps mode question
     */
    generateEDOStepsQuestion() {
        // Random reference note: middle C (63) ± 12
        const referenceNote = randomInt(63 - 12, 63 + 12);

        // Random interval from config
        const interval = randomChoice(this.config.intervals);

        // Calculate target note
        const targetNote = referenceNote + interval;

        // Validate target is within range
        if (targetNote < 0 || targetNote >= 127) {
            // Retry
            this.generateEDOStepsQuestion();
            return;
        }

        // Store question data
        this.currentQuestionData = {
            type: 'edo-steps',
            referenceNote,
            interval,
            correctAnswers: [targetNote]
        };

        // Display question without cents initially
        this.pianoRoll.setReferenceNote(referenceNote);

        // Use custom name if available
        const intervalName = this.config.edoStepNames && this.config.edoStepNames[interval]
            ? `${interval} (${this.config.edoStepNames[interval]})`
            : `${interval}`;

        this.currentTaskDisplay.textContent = `Place interval: ${intervalName}`;

        // Play reference note
        audioEngine.playNote(referenceNote, 0.5);
    }

    /**
     * Generate ratio mode question
     */
    generateRatioQuestion() {
        // Random reference note
        const referenceNote = randomInt(63 - 12, 63 + 12);

        // Random ratio from mappings
        const ratioMapping = randomChoice(this.config.ratioMappings);

        // Calculate target note
        const targetNote = referenceNote + ratioMapping.steps;

        // Validate target is within range
        if (targetNote < 0 || targetNote >= 127) {
            // Retry
            this.generateRatioQuestion();
            return;
        }

        // Store question data
        this.currentQuestionData = {
            type: 'ratio',
            referenceNote,
            ratioStr: ratioMapping.ratioStr,
            steps: ratioMapping.steps,
            correctAnswers: [targetNote]
        };

        // Display question without cents and steps initially
        this.pianoRoll.setReferenceNote(referenceNote);

        // Use custom name if available
        const ratioName = this.config.ratioNames && this.config.ratioNames[ratioMapping.ratioStr]
            ? `${ratioMapping.ratioStr} (${this.config.ratioNames[ratioMapping.ratioStr]})`
            : `${ratioMapping.ratioStr}`;

        this.currentTaskDisplay.textContent = `Place ratio: ${ratioName}`;

        // Play reference note
        audioEngine.playNote(referenceNote, 0.5);
    }

    /**
     * Generate chord mode question
     */
    generateChordQuestion() {
        // Random reference note
        const referenceNote = randomInt(63 - 12, 63 + 12);

        // Random chord from config
        const chord = randomChoice(this.config.chords);

        // Determine if using inversions and pick pivot note
        let pivotIndex = 0; // Default to root position (first note is pivot)
        let displayIntervals = chord.intervals;

        if (this.config.useInversions && chord.intervals.length > 1) {
            // Pick a random inversion (any note in the chord can be the pivot)
            pivotIndex = randomInt(0, chord.intervals.length - 1);
        }

        const pivotInterval = chord.intervals[pivotIndex];
        const pivotNote = referenceNote + pivotInterval;

        // Calculate all chord notes relative to reference
        const allNotes = chord.intervals.map(interval => referenceNote + interval);

        // Validate all targets are within range
        if (allNotes.some(note => note < 0 || note >= 127)) {
            // Retry
            this.generateChordQuestion();
            return;
        }

        // Correct answers are all notes EXCEPT the pivot note
        const correctAnswers = chord.intervals
            .filter((interval, idx) => idx !== pivotIndex)
            .map(interval => referenceNote + interval);

        // Store question data
        this.currentQuestionData = {
            type: 'chord',
            referenceNote,
            pivotNote,
            chordName: chord.name,
            chordIntervals: chord.intervals,
            pivotIndex,
            correctAnswers: correctAnswers
        };

        // Display question with pivot note underlined
        const displayParts = chord.intervals.map((interval, idx) => {
            if (idx === pivotIndex) {
                return `<u>${interval}</u>`; // Underline pivot
            }
            return interval;
        });

        this.pianoRoll.setReferenceNote(pivotNote);
        this.currentTaskDisplay.innerHTML = `Place chord: ${chord.name} [${displayParts.join(', ')}]`;

        // Play pivot note
        audioEngine.playNote(pivotNote, 0.5);
    }

    /**
     * Update submit button state
     */
    updateSubmitButton(userNotes) {
        // Enable submit if user has placed notes
        this.submitBtn.disabled = userNotes.size === 0;
    }

    /**
     * Submit and validate answer
     */
    submitAnswer() {
        const userNotes = this.pianoRoll.getUserNotes().sort((a, b) => a - b);
        const correctAnswers = this.currentQuestionData.correctAnswers.sort((a, b) => a - b);

        // Check if answer is correct
        const isCorrect = this.validateAnswer(userNotes, correctAnswers);

        // Record time
        const questionTime = (Date.now() - this.questionStartTime) / 1000;
        this.score.times.push(questionTime);
        this.score.total++;

        if (isCorrect) {
            this.score.correct++;
        }

        // Update display to show cents/steps information after answering
        if (this.currentQuestionData.type === 'edo-steps') {
            const cents = getCents(this.config.edo, this.currentQuestionData.interval);
            const interval = this.currentQuestionData.interval;
            const intervalName = this.config.edoStepNames && this.config.edoStepNames[interval]
                ? `${interval} (${this.config.edoStepNames[interval]})`
                : `${interval}`;
            this.currentTaskDisplay.textContent = `Place interval: ${intervalName} (${cents})`;
        } else if (this.currentQuestionData.type === 'ratio') {
            const cents = getCents(this.config.edo, this.currentQuestionData.steps);
            const ratioName = this.config.ratioNames && this.config.ratioNames[this.currentQuestionData.ratioStr]
                ? `${this.currentQuestionData.ratioStr} (${this.config.ratioNames[this.currentQuestionData.ratioStr]})`
                : `${this.currentQuestionData.ratioStr}`;
            this.currentTaskDisplay.textContent = `Place ratio: ${ratioName} (${this.currentQuestionData.steps} steps, ${cents})`;
        }

        // Play audio feedback
        if (this.currentQuestionData.type === 'chord') {
            // Play full chord (pivot note + all other notes)
            const allChordNotes = this.currentQuestionData.chordIntervals.map(
                interval => this.currentQuestionData.referenceNote + interval
            );
            audioEngine.playChord(allChordNotes, 1.0);
        } else {
            // Play interval (reference + answer)
            audioEngine.playChord([this.currentQuestionData.referenceNote, correctAnswers[0]], 1.0);
        }

        // Show visual feedback
        this.pianoRoll.showFeedback(correctAnswers, isCorrect);
        this.showFeedbackOverlay(isCorrect);

        // Continue to next question after delay
        setTimeout(() => {
            this.hideFeedbackOverlay();
            this.nextQuestion();
        }, 1500);
    }

    /**
     * Validate user answer
     */
    validateAnswer(userNotes, correctAnswers) {
        if (userNotes.length !== correctAnswers.length) {
            return false;
        }

        // Exact match required
        for (let i = 0; i < userNotes.length; i++) {
            if (userNotes[i] !== correctAnswers[i]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Show feedback overlay
     */
    showFeedbackOverlay(isCorrect) {
        this.feedbackOverlay.classList.add('show');

        if (isCorrect) {
            this.feedbackOverlay.classList.add('correct');
            this.feedbackOverlay.classList.remove('incorrect');
            this.feedbackOverlay.querySelector('.feedback-message').textContent = 'Correct!';
        } else {
            this.feedbackOverlay.classList.add('incorrect');
            this.feedbackOverlay.classList.remove('correct');
            this.feedbackOverlay.querySelector('.feedback-message').textContent = 'Incorrect';
        }
    }

    /**
     * Hide feedback overlay
     */
    hideFeedbackOverlay() {
        this.feedbackOverlay.classList.remove('show');
    }

    /**
     * Start timer
     */
    startTimer() {
        this.timerInterval = setInterval(() => {
            this.updateTimers();
        }, 100);
    }

    /**
     * Update timer displays
     */
    updateTimers() {
        const totalTime = (Date.now() - this.totalStartTime) / 1000;
        this.totalTimer.textContent = formatTime(totalTime);

        if (this.score.times.length > 0) {
            const avgTime = this.score.times.reduce((a, b) => a + b, 0) / this.score.times.length;
            this.avgTimer.textContent = formatTime(avgTime);
        } else {
            this.avgTimer.textContent = '0.0s';
        }
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * End game and show results
     */
    endGame() {
        this.stopTimer();

        // Calculate final stats
        const totalTime = (Date.now() - this.totalStartTime) / 1000;
        const avgTime = this.score.times.reduce((a, b) => a + b, 0) / this.score.times.length;
        const accuracy = (this.score.correct / this.score.total * 100).toFixed(1);

        // Update results screen
        document.getElementById('accuracy-stat').textContent = accuracy + '%';
        document.getElementById('total-time-stat').textContent = formatTime(totalTime);
        document.getElementById('avg-time-stat').textContent = formatTime(avgTime);
        document.getElementById('correct-stat').textContent = `${this.score.correct}/${this.score.total}`;

        // Show results screen
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('results-screen').classList.add('active');
    }

    /**
     * Quit game
     */
    quit() {
        if (confirm('Are you sure you want to quit?')) {
            this.stopTimer();
            document.getElementById('game-screen').classList.remove('active');
            document.getElementById('config-screen').classList.add('active');
        }
    }
}
