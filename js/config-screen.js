// Configuration Screen - Handle user configuration and mode switching

class ConfigScreen {
    constructor() {
        this.configScreen = document.getElementById('config-screen');
        this.gameScreen = document.getElementById('game-screen');

        // Input elements
        this.edoInput = document.getElementById('edo-input');
        this.questionCountInput = document.getElementById('question-count');
        this.noteLabelsInput = document.getElementById('note-labels-input');
        this.synthTypeSelect = document.getElementById('synth-type');
        this.intervalsInput = document.getElementById('intervals-input');
        this.ratiosInput = document.getElementById('ratios-input');
        this.chordsInput = document.getElementById('chords-input');
        this.inversionsToggle = document.getElementById('toggle-inversions');
        this.customLabelsToggle = document.getElementById('toggle-custom-labels-config');
        this.edoNamesInput = document.getElementById('edo-names-input');
        this.ratioNamesInput = document.getElementById('ratio-names-input');

        // Mode tabs
        this.modeTabs = document.querySelectorAll('.mode-tab');
        this.modeContents = document.querySelectorAll('.mode-content');
        this.currentMode = 'edo-steps';

        // Buttons
        this.startBtn = document.getElementById('start-btn');

        this.setupEventListeners();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Mode tab switching
        this.modeTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const mode = tab.dataset.mode;
                this.switchMode(mode);
            });
        });

        // EDO input change - update EDO steps based on stock ratios
        this.edoInput.addEventListener('input', () => {
            this.updateDefaultEdoSteps();
            this.updateNoteLabels();
        });

        // Custom labels toggle
        this.customLabelsToggle.addEventListener('change', () => {
            this.toggleCustomLabelsSection();
        });

        // Start button
        this.startBtn.addEventListener('click', () => {
            this.startGame();
        });

        // Initialize EDO steps and note labels on load
        this.updateDefaultEdoSteps();
        this.updateNoteLabels();
        this.toggleCustomLabelsSection();
    }

    /**
     * Toggle visibility of custom labels sections
     */
    toggleCustomLabelsSection() {
        const isCustomLabels = this.customLabelsToggle.checked;

        // Show/hide note labels input only
        const noteLabelsSection = document.getElementById('note-labels-section');
        if (noteLabelsSection) {
            noteLabelsSection.style.display = isCustomLabels ? 'block' : 'none';
        }
    }

    /**
     * Update note labels to match EDO (generate default labels if needed)
     */
    updateNoteLabels() {
        const edo = parseInt(this.edoInput.value);
        if (isNaN(edo) || edo < 1 || edo > 127) return;

        // Get current labels
        const currentLabels = this.noteLabelsInput.value
            .split(',')
            .map(label => label.trim())
            .filter(label => label.length > 0);

        // If current labels don't match EDO count, generate new ones for 12-EDO
        // Otherwise keep user's custom labels
        if (edo === 12 && currentLabels.length !== 12) {
            this.noteLabelsInput.value = 'C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B';
        }
    }

    /**
     * Update default EDO steps based on current EDO and stock ratios
     */
    updateDefaultEdoSteps() {
        const edo = parseInt(this.edoInput.value);
        if (isNaN(edo) || edo < 1 || edo > 127) return;

        // Stock ratios with names and precedence
        const stockRatios = [
            { ratio: '8/7', name: 'septimal major second' },
            { ratio: '10/9', name: 'minor whole tone' },
            { ratio: '9/8', name: 'major second' },
            { ratio: '6/5', name: 'minor third' },
            { ratio: '5/4', name: 'major third' },
            { ratio: '4/3', name: 'perfect fourth' },
            { ratio: '7/5', name: 'lesser septimal tritone' },
            { ratio: '10/7', name: 'greater septimal tritone' },
            { ratio: '3/2', name: 'perfect fifth' },
            { ratio: '8/5', name: 'minor sixth' },
            { ratio: '5/3', name: 'major sixth' },
            { ratio: '9/5', name: 'minor seventh' },  // Check first (has precedence)
            { ratio: '7/4', name: 'harmonic seventh' },
            { ratio: '15/8', name: 'major seventh' }
        ];

        // Get EDO approximations for these ratios
        const ratioMappings = getRatioMappings(edo, stockRatios.map(r => r.ratio));

        // Build a map of steps to ratio info with error
        const stepToRatios = {};
        for (const mapping of ratioMappings) {
            if (!stepToRatios[mapping.steps]) {
                stepToRatios[mapping.steps] = [];
            }
            const ratioInfo = stockRatios.find(r => r.ratio === mapping.ratioStr);
            if (ratioInfo) {
                stepToRatios[mapping.steps].push({
                    ratio: mapping.ratioStr,
                    name: ratioInfo.name,
                    error: mapping.error
                });
            }
        }

        // Choose the best name for each step
        const stepToName = {};
        for (const [step, ratios] of Object.entries(stepToRatios)) {
            if (ratios.length === 1) {
                stepToName[step] = ratios[0].name;
            } else {
                // Multiple ratios map to same step
                // Special case: 7/5 and 10/7 both map to same step -> "tritone"
                const hasLesserTritone = ratios.some(r => r.ratio === '7/5');
                const hasGreaterTritone = ratios.some(r => r.ratio === '10/7');
                if (hasLesserTritone && hasGreaterTritone) {
                    stepToName[step] = 'tritone';
                } else {
                    // Use the one with lowest error
                    const best = ratios.reduce((a, b) => a.error < b.error ? a : b);
                    stepToName[step] = best.name;
                }
            }
        }

        // Extract unique steps and sort
        const steps = [...new Set(ratioMappings.map(m => m.steps))].sort((a, b) => a - b);

        // Format as "step : name"
        const intervalLines = steps.map(step => {
            const name = stepToName[step];
            return name ? `${step} : ${name}` : `${step}`;
        });

        // Update the intervals input
        this.intervalsInput.value = intervalLines.join('\n');

        // Also update default chords
        this.updateDefaultChords();
    }

    /**
     * Update default chords based on current EDO and ratio approximations
     */
    updateDefaultChords() {
        const edo = parseInt(this.edoInput.value);
        if (isNaN(edo) || edo < 1 || edo > 127) return;

        // Define stock chords with their ratio formulas
        const stockChords = [
            { ratios: ['1/1', '5/4', '3/2'], name: 'major' },
            { ratios: ['1/1', '6/5', '3/2'], name: 'minor' },
            { ratios: ['1/1', '5/4', '3/2', '15/8'], name: 'maj7' },
            { ratios: ['1/1', '6/5', '3/2', '9/5'], name: 'min7' },
            { ratios: ['1/1', '5/4', '3/2', '9/5'], name: 'dom7' },
            { ratios: ['1/1', '5/4', '3/2', '7/4'], name: 'harmonic7' }
        ];

        const chordLines = [];

        for (const chord of stockChords) {
            // Get EDO approximations for each ratio (with 50% error threshold for chords)
            const ratioMappings = getRatioMappingsWithThreshold(edo, chord.ratios, 50);

            // Skip if any ratio has >50% error
            if (ratioMappings.length !== chord.ratios.length) continue;

            // Get the steps for each ratio
            const steps = ratioMappings.map(m => m.steps);

            // For harmonic7, check if it's the same as dom7
            if (chord.name === 'harmonic7') {
                const dom7Ratios = getRatioMappingsWithThreshold(edo, ['1/1', '5/4', '3/2', '9/5'], 50);
                if (dom7Ratios.length === 4) {
                    const dom7Steps = dom7Ratios.map(m => m.steps);
                    // If harmonic7 and dom7 have the same steps, skip harmonic7
                    if (JSON.stringify(steps) === JSON.stringify(dom7Steps)) {
                        continue;
                    }
                }
            }

            // Format as [0, step1, step2, ...] : name
            chordLines.push(`[${steps.join(', ')}] : ${chord.name}`);
        }

        // Update the chords input
        this.chordsInput.value = chordLines.join('\n');
    }

    /**
     * Switch between modes
     */
    switchMode(mode) {
        this.currentMode = mode;

        // Update tab active states
        this.modeTabs.forEach(tab => {
            if (tab.dataset.mode === mode) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update content active states
        this.modeContents.forEach(content => {
            if (content.id === `${mode}-content`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
    }

    /**
     * Validate and get configuration
     */
    getConfig() {
        const edo = parseInt(this.edoInput.value);
        const questionCount = parseInt(this.questionCountInput.value);
        const synthType = this.synthTypeSelect.value;

        // Validate basic inputs
        if (isNaN(edo) || edo < 1 || edo > 127) {
            alert('Please enter a valid EDO between 1 and 127');
            return null;
        }

        if (isNaN(questionCount) || questionCount < 1) {
            alert('Please enter a valid question count');
            return null;
        }

        // Parse custom note labels
        const customLabels = this.noteLabelsInput.value
            .split(',')
            .map(label => label.trim())
            .filter(label => label.length > 0);

        // Parse EDO step names (always parse if input exists)
        const edoStepNames = {};
        if (this.edoNamesInput.value) {
            const lines = this.edoNamesInput.value.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s*(\d+)\s*:\s*(.+)$/);
                if (match) {
                    const step = parseInt(match[1]);
                    const name = match[2].trim();
                    edoStepNames[step] = name;
                }
            }
        }

        // Parse ratio names (always parse if input exists)
        const ratioNames = {};
        if (this.ratioNamesInput.value) {
            const lines = this.ratioNamesInput.value.split('\n');
            for (const line of lines) {
                const match = line.match(/^\s*([^:]+)\s*:\s*(.+)$/);
                if (match) {
                    const ratio = match[1].trim();
                    const name = match[2].trim();
                    ratioNames[ratio] = name;
                }
            }
        }

        const config = {
            edo,
            questionCount,
            synthType,
            customLabels,
            useCustomLabels: this.customLabelsToggle.checked,
            edoStepNames,
            ratioNames,
            mode: this.currentMode
        };

        // Mode-specific configuration
        if (this.currentMode === 'edo-steps') {
            // Parse intervals in format "step : name" or just "step"
            const intervalLines = this.intervalsInput.value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (intervalLines.length === 0) {
                alert('Please enter at least one interval');
                return null;
            }

            const intervals = [];
            const intervalNames = {};

            for (const line of intervalLines) {
                // Try to parse "step : name" format
                const match = line.match(/^\s*(\d+)\s*:\s*(.+)$/);
                if (match) {
                    const step = parseInt(match[1]);
                    const name = match[2].trim();
                    intervals.push(step);
                    intervalNames[step] = name;
                } else {
                    // Just a number
                    const step = parseInt(line);
                    if (!isNaN(step)) {
                        intervals.push(step);
                    }
                }
            }

            if (intervals.length === 0) {
                alert('Please enter at least one valid interval');
                return null;
            }

            // Validate intervals are within EDO range
            const invalidIntervals = intervals.filter(i => i < 1 || i >= edo);
            if (invalidIntervals.length > 0) {
                alert(`Intervals must be between 1 and ${edo - 1}`);
                return null;
            }

            config.intervals = intervals.map(i => Math.round(i));
            // Merge with any existing names from edoStepNames
            config.edoStepNames = { ...edoStepNames, ...intervalNames };

        } else if (this.currentMode === 'ratio') {
            const ratioLines = this.ratiosInput.value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (ratioLines.length === 0) {
                alert('Please enter at least one ratio');
                return null;
            }

            // Parse ratios in format "ratio : name" or just "ratio"
            const ratios = [];
            const ratioNamesFromInput = {};

            for (const line of ratioLines) {
                // Try to parse "ratio : name" format
                const match = line.match(/^\s*([^:]+)\s*:\s*(.+)$/);
                if (match) {
                    const ratio = match[1].trim();
                    const name = match[2].trim();
                    ratios.push(ratio);
                    ratioNamesFromInput[ratio] = name;
                } else {
                    // Just a ratio
                    ratios.push(line);
                }
            }

            // Get ratio mappings (filters ratios with error < 40%)
            const ratioMappings = getRatioMappings(edo, ratios);

            if (ratioMappings.length === 0) {
                alert('No valid ratios found with error < 40% for this EDO');
                return null;
            }

            config.ratioMappings = ratioMappings;
            // Merge with any existing names from ratioNames
            config.ratioNames = { ...ratioNames, ...ratioNamesFromInput };

        } else if (this.currentMode === 'chord') {
            const chordLines = this.chordsInput.value
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0);

            if (chordLines.length === 0) {
                alert('Please enter at least one chord');
                return null;
            }

            const chords = [];
            for (const line of chordLines) {
                const chord = parseChord(line);
                if (chord === null) {
                    alert(`Invalid chord format: ${line}\nExpected format: [0, 4, 7] : major`);
                    return null;
                }

                // Validate intervals are within EDO range
                const invalidIntervals = chord.intervals.filter(i => i < 0 || i >= edo);
                if (invalidIntervals.length > 0) {
                    alert(`Chord "${chord.name}" has intervals outside EDO range`);
                    return null;
                }

                chords.push(chord);
            }

            config.chords = chords;
            config.useInversions = this.inversionsToggle.checked;
        }

        return config;
    }

    /**
     * Start the game with current configuration
     */
    startGame() {
        const config = this.getConfig();
        if (!config) return;

        // Hide config screen, show game screen
        this.configScreen.classList.remove('active');
        this.gameScreen.classList.add('active');

        // Initialize game
        if (window.gameLogic) {
            window.gameLogic.start(config);
        }
    }

    /**
     * Show config screen (for restarting)
     */
    show() {
        this.configScreen.classList.add('active');
        this.gameScreen.classList.remove('active');
    }
}
