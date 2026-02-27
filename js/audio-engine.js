// Audio Engine - Web Audio API for microtonal synthesis

class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.lowpassFilter = null;
        this.oscillatorType = 'sine';
        this.edo = 12;
        this.activeOscillators = [];
    }

    /**
     * Initialize audio context and setup audio graph
     */
    init(synthType = 'sine', edo = 12) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.oscillatorType = synthType;
        this.edo = edo;

        // Setup audio graph: Oscillator -> Gain -> Lowpass Filter -> Destination
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.3; // Moderate volume

        this.lowpassFilter = this.audioContext.createBiquadFilter();
        this.lowpassFilter.type = 'lowpass';
        this.lowpassFilter.frequency.value = 1000; // 1kHz cutoff

        // Calculate Q for 6dB/octave slope
        // For a single-pole filter (6dB/oct), Q should be low
        // Butterworth response: Q = 1/sqrt(2) ≈ 0.707
        this.lowpassFilter.Q.value = 0.707;

        // Connect filter to master gain to destination
        this.masterGain.connect(this.lowpassFilter);
        this.lowpassFilter.connect(this.audioContext.destination);
    }

    /**
     * Update synth type
     */
    setSynthType(type) {
        this.oscillatorType = type;
    }

    /**
     * Update EDO
     */
    setEDO(edo) {
        this.edo = edo;
    }

    /**
     * Play a single note
     */
    playNote(step, duration = 0.5) {
        if (!this.audioContext) return;

        const frequency = stepsToFrequency(step, this.edo);
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = this.oscillatorType;
        oscillator.frequency.value = frequency;

        // ADSR envelope (simplified: attack + release)
        const now = this.audioContext.currentTime;
        const attackTime = 0.02;
        const releaseTime = 0.5; // 500ms release

        gainNode.gain.value = 0;
        gainNode.gain.linearRampToValueAtTime(0.7, now + attackTime);
        gainNode.gain.linearRampToValueAtTime(0.7, now + duration - releaseTime);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);

        oscillator.start(now);
        oscillator.stop(now + duration);

        // Clean up
        oscillator.onended = () => {
            oscillator.disconnect();
            gainNode.disconnect();
        };

        return oscillator;
    }

    /**
     * Play multiple notes simultaneously (for chords)
     */
    playChord(steps, duration = 1.0) {
        if (!this.audioContext) return;

        const oscillators = steps.map(step => {
            const frequency = stepsToFrequency(step, this.edo);
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = this.oscillatorType;
            oscillator.frequency.value = frequency;

            const now = this.audioContext.currentTime;
            const attackTime = 0.02;
            const releaseTime = 0.5; // 500ms release

            gainNode.gain.value = 0;
            gainNode.gain.linearRampToValueAtTime(0.5, now + attackTime);
            gainNode.gain.linearRampToValueAtTime(0.5, now + duration - releaseTime);
            gainNode.gain.linearRampToValueAtTime(0, now + duration);

            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);

            oscillator.start(now);
            oscillator.stop(now + duration);

            oscillator.onended = () => {
                oscillator.disconnect();
                gainNode.disconnect();
            };

            return oscillator;
        });

        return oscillators;
    }

    /**
     * Stop all currently playing notes
     */
    stopAll() {
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Oscillator may already be stopped
            }
        });
        this.activeOscillators = [];
    }

    /**
     * Resume audio context (required for some browsers)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// Create global audio engine instance
const audioEngine = new AudioEngine();
