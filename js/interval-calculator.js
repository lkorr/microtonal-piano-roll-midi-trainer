// Interval Calculator - EDO and ratio conversion utilities

/**
 * Calculate relative interval error for a ratio in a given EDO
 * Formula: abs(round(n*log2(r)) - n*log2(r)) * 100%
 * where n = EDO number, r = ratio
 */
function calculateRelativeError(edo, ratio) {
    const nLog2R = edo * Math.log2(ratio);
    const rounded = Math.round(nLog2R);
    const error = Math.abs(rounded - nLog2R) * 100;
    return error;
}

/**
 * Find the best EDO approximation (step count) for a given ratio
 */
function findBestEDOApproximation(edo, ratio) {
    const nLog2R = edo * Math.log2(ratio);
    return Math.round(nLog2R);
}

/**
 * Get ratio mappings for a given EDO
 * Returns array of {ratio, ratioStr, steps, error} for ratios with error < 40%
 */
function getRatioMappings(edo, ratios) {
    return getRatioMappingsWithThreshold(edo, ratios, 40);
}

/**
 * Get ratio mappings for a given EDO with custom error threshold
 * Returns array of {ratio, ratioStr, steps, error} for ratios with error < threshold
 */
function getRatioMappingsWithThreshold(edo, ratios, threshold) {
    const mappings = [];

    for (const ratioStr of ratios) {
        const ratio = parseRatio(ratioStr);
        if (ratio === null || ratio <= 0) continue;

        const error = calculateRelativeError(edo, ratio);

        // Only include ratios with error < threshold
        if (error < threshold) {
            const steps = findBestEDOApproximation(edo, ratio);
            mappings.push({
                ratio,
                ratioStr: ratioStr.trim(),
                steps,
                error
            });
        }
    }

    return mappings;
}

/**
 * Convert EDO step to frequency
 * For a 127-note range, we'll use MIDI note 0-126 mapping
 * Reference: A4 (MIDI 69) = 440 Hz
 * But we need to account for EDO instead of 12-TET
 */
function stepsToFrequency(step, edo) {
    // MIDI note 69 (A4) = 440 Hz
    // For EDO: frequency = 440 * 2^((step - 69) * (edo/12) / edo)
    // Simplifies to: 440 * 2^((step - 69) / 12)
    // Wait, we need to rethink this...

    // In a 127-note piano roll with arbitrary EDO:
    // Let's define middle C as step 63 (middle of 0-126)
    // Middle C = ~261.63 Hz (MIDI note 60)

    // For any EDO, one octave = edo steps
    // frequency = baseFreq * 2^(stepDistance / edo)

    const middleC = 261.63; // Hz
    const middleCStep = 63; // Middle of 127 notes
    const stepDistance = step - middleCStep;

    return middleC * Math.pow(2, stepDistance / edo);
}

/**
 * Get the frequency for a MIDI note in standard 12-TET
 * Used for comparison/reference
 */
function midiToFrequency(midiNote) {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
}

/**
 * Format cents value
 */
function getCents(edo, steps) {
    return (steps / edo * 1200).toFixed(1) + '¢';
}

/**
 * Get note name for display based on step number and EDO
 */
function getNoteName(step, edo) {
    const middleCStep = 63;
    const stepInOctave = ((step - middleCStep) % edo + edo) % edo;

    return `${stepInOctave}\\${edo}`;
}
