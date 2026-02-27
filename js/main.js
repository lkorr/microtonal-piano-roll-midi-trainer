// Main - Application initialization and coordination

// Global instances
let configScreen;
let gameLogic;

/**
 * Initialize application
 */
function init() {
    console.log('Initializing Microtonal Piano Roll Trainer...');

    // Create global instances
    configScreen = new ConfigScreen();
    gameLogic = new GameLogic();
    window.gameLogic = gameLogic;

    // Setup results screen
    setupResultsScreen();

    console.log('Application ready!');
}

/**
 * Setup results screen event listeners
 */
function setupResultsScreen() {
    const restartBtn = document.getElementById('restart-btn');

    restartBtn.addEventListener('click', () => {
        // Hide results screen, show config screen
        document.getElementById('results-screen').classList.remove('active');
        configScreen.show();
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
