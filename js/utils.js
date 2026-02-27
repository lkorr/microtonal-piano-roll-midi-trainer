// Utility functions

/**
 * Parse comma-separated string into array of numbers
 */
function parseCommaSeparated(str) {
    return str.split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => parseFloat(s))
        .filter(n => !isNaN(n));
}

/**
 * Parse ratio string (e.g., "3/2") into decimal
 */
function parseRatio(ratioStr) {
    const parts = ratioStr.trim().split('/');
    if (parts.length !== 2) return null;

    const numerator = parseFloat(parts[0]);
    const denominator = parseFloat(parts[1]);

    if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return null;
    }

    return numerator / denominator;
}

/**
 * Parse chord definition (e.g., "[0, 4, 7] : major")
 */
function parseChord(chordStr) {
    const match = chordStr.match(/\[([^\]]+)\]\s*:\s*(.+)/);
    if (!match) return null;

    const intervals = match[1].split(',')
        .map(s => s.trim())
        .map(s => parseInt(s))
        .filter(n => !isNaN(n));

    const name = match[2].trim();

    if (intervals.length === 0 || !name) return null;

    return { intervals, name };
}

/**
 * Format time in seconds to string
 */
function formatTime(seconds) {
    return seconds.toFixed(1) + 's';
}

/**
 * Get random integer between min (inclusive) and max (inclusive)
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array
 */
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
