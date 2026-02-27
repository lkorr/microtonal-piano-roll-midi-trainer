# Microtonal Piano Roll MIDI Trainer

An interactive web application for training ear and visual recognition of microtonal intervals, ratios, and chords in any EDO (Equal Divisions of the Octave) tuning system.

## Features

### Three Training Modes

1. **EDO Steps Mode**: Practice placing intervals by EDO step count
2. **Ratio Mode**: Train with just intonation ratios (e.g., 3/2, 5/4, 7/4)
3. **Chord Mode**: Learn chord voicings with optional inversions

### Key Capabilities

- **Any EDO Support**: Train in 12-EDO, 17-EDO, 19-EDO, 22-EDO, 31-EDO, or any division up to 127
- **Dynamic Ratio Approximations**: Automatically calculates best EDO approximations for stock ratios
- **Chord Inversions**: Practice chord voicings from any pivot note
- **Visual Feedback**: DAW-style piano roll with zoom, scroll, and note placement
- **Audio Playback**: Configurable synth types (sine, sawtooth, square, triangle) with 500ms release
- **Detailed Information**: View cents and EDO step equivalents after answering
- **Performance Tracking**: Accuracy, timing, and statistics

### Stock Ratios

The app comes with these default just intonation ratios:
- 8/7 (septimal major second)
- 16/13 (tridecimal neutral third)
- 5/4 (major third)
- 4/3 (perfect fourth)
- 11/8 (undecimal tritone)
- 16/11 (inverse undecimal tritone)
- 3/2 (perfect fifth)
- 8/5 (minor sixth)
- 13/8 (tridecimal neutral sixth)
- 7/4 (harmonic seventh)

### Stock Chords

Default chord types based on just intonation ratios:
- **Major**: 1/1, 5/4, 3/2
- **Minor**: 1/1, 6/5, 3/2
- **Maj7**: 1/1, 5/4, 3/2, 15/8
- **Min7**: 1/1, 6/5, 3/2, 9/5
- **Dom7**: 1/1, 5/4, 3/2, 9/5
- **Harmonic7**: 1/1, 5/4, 3/2, 7/4

## How to Use

1. **Configure Settings**:
   - Set your desired EDO (default: 12)
   - Choose number of questions (default: 10)
   - Select synth type
   - Pick a training mode

2. **EDO Steps Mode**:
   - Intervals auto-populate based on ratio approximations
   - Click to place the interval above the reference note
   - See cents value after submitting

3. **Ratio Mode**:
   - Select from stock ratios or add custom ones
   - Only ratios with <40% error are included
   - View EDO steps and cents after answering

4. **Chord Mode**:
   - Enable "Include Inversions" for advanced training
   - Underlined note in display shows the pivot (already placed)
   - Place remaining chord tones above and below

5. **Visual Controls**:
   - Click/drag on left sidebar to zoom in/out
   - Scroll to navigate the piano roll
   - Toggle 12-EDO black keys overlay
   - Toggle hover-only labels

## Live Demo

**[Try it now!](https://lkorr.github.io/microtonal-piano-roll-midi-trainer/)**

## Technical Details

- Pure JavaScript (no frameworks)
- Web Audio API for microtonal synthesis
- Responsive design
- Works in all modern browsers

## Development

Simply open `index.html` in a web browser. No build process required.

## License

MIT License - feel free to use, modify, and distribute.

## Credits

Created for musicians, composers, and anyone interested in exploring microtonal music and just intonation.
