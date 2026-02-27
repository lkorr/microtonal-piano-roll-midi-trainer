// Piano Roll - Rendering and interaction for the vertical piano roll

class PianoRoll {
    constructor(containerId, numNotes = 127) {
        this.container = document.getElementById(containerId);
        this.wrapper = document.getElementById('piano-roll-wrapper');
        this.zoomSidebar = document.getElementById('zoom-sidebar');
        this.numNotes = numNotes;
        this.edo = 12;
        this.keys = [];
        this.noteRects = {}; // Store note rectangle elements by step
        this.referenceNote = null;
        this.userPlacedNotes = new Set();
        this.onNoteClick = null;

        // Drag zoom state (like Ableton)
        this.isDraggingZoom = false;
        this.startY = 0;
        this.startKeyHeight = 0;
        this.zoomPivotY = 0; // Mouse position to keep centered during zoom

        // Zoom state
        this.keyHeight = 40; // Default height in pixels (2x zoom)
        this.minKeyHeight = 8;
        this.maxKeyHeight = 50;

        // Display options
        this.showBlackKeys = false;
        this.hoverLabelsOnly = false;

        this.setupDragZoom();
        this.setupToggleControls();
    }

    /**
     * Initialize and render the piano roll
     */
    init(edo) {
        this.edo = edo;
        this.keys = [];
        this.container.innerHTML = '';

        // Create piano keys (0 to 126)
        for (let i = 0; i < this.numNotes; i++) {
            const keyElement = document.createElement('div');
            keyElement.className = 'piano-key';
            keyElement.dataset.step = i;

            // Check if this is an octave marker
            // Middle C is step 63, mark every edo steps
            const middleCStep = 63;
            const distanceFromMiddleC = i - middleCStep;

            if (distanceFromMiddleC % this.edo === 0) {
                keyElement.classList.add('octave-marker');
            }

            // Check if this should be a black key (12-EDO pattern)
            if (this.isBlackKey(i)) {
                keyElement.classList.add('black-key');
            }

            // Add click handler
            keyElement.addEventListener('click', () => this.handleKeyClick(i));

            this.container.appendChild(keyElement);
            this.keys[i] = keyElement;
        }

        // Apply current display settings
        this.applyBlackKeyPattern();

        // Apply initial key heights and font sizes
        this.updateKeyHeights();

        // Create labels on sidebar
        this.createSidebarLabels();

        // Scroll to middle
        this.scrollToMiddle();
    }

    /**
     * Check if a step should be a black key in 12-EDO pattern
     * Pattern: WWHWWWH starting from middle C (step 63)
     * Black keys are at positions: 1, 3, 6, 8, 10 (semitones from C)
     */
    isBlackKey(step) {
        const middleCStep = 63;
        const relativeStep = step - middleCStep;
        const stepIn12Edo = ((relativeStep % 12) + 12) % 12;

        // Black key positions in 12-EDO: C#, D#, F#, G#, A#
        const blackKeyPositions = [1, 3, 6, 8, 10];
        return blackKeyPositions.includes(stepIn12Edo);
    }

    /**
     * Create note labels on the zoom sidebar
     */
    createSidebarLabels() {
        // Remove old label container if it exists
        const oldContainer = this.wrapper.querySelector('.sidebar-labels');
        if (oldContainer) {
            oldContainer.remove();
        }

        // Create label container INSIDE the wrapper so it scrolls with the piano roll
        const labelContainer = document.createElement('div');
        labelContainer.className = 'sidebar-labels';

        // Create labels for each key (in SAME order as piano roll - 0 to numNotes-1)
        // Since both use column-reverse, they'll align correctly
        for (let i = 0; i < this.numNotes; i++) {
            const label = document.createElement('div');
            label.className = 'sidebar-label';
            label.textContent = getNoteName(i, this.edo);

            // Set initial height and font size
            const fontSize = Math.max(7, Math.min(12, this.keyHeight * 0.45));
            label.style.height = this.keyHeight + 'px';
            label.style.fontSize = fontSize + 'px';

            // Add octave marker class
            const middleCStep = 63;
            const distanceFromMiddleC = i - middleCStep;
            if (distanceFromMiddleC % this.edo === 0) {
                label.classList.add('sidebar-label-octave');
            }

            labelContainer.appendChild(label);
        }

        // Insert label container at the beginning of wrapper so it appears on the left
        this.wrapper.insertBefore(labelContainer, this.wrapper.firstChild);
    }

    /**
     * Handle key click
     */
    handleKeyClick(step) {
        // Don't allow clicking on reference note
        if (step === this.referenceNote) return;

        // Toggle user placed note
        if (this.userPlacedNotes.has(step)) {
            this.removeNoteRect(step);
            this.userPlacedNotes.delete(step);
        } else {
            this.addNoteRect(step, 'user-placed');
            this.userPlacedNotes.add(step);

            // Play note
            audioEngine.playNote(step, 0.3);
        }

        // Callback
        if (this.onNoteClick) {
            this.onNoteClick(step, this.userPlacedNotes);
        }
    }

    /**
     * Add a note rectangle to a piano key
     */
    addNoteRect(step, className) {
        // Remove existing note rect if any
        this.removeNoteRect(step);

        const noteRect = document.createElement('div');
        noteRect.className = `note-rect ${className}`;
        noteRect.dataset.step = step;

        // Add click handler for note rect
        noteRect.addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleKeyClick(step);
        });

        this.keys[step].appendChild(noteRect);
        this.noteRects[step] = noteRect;
    }

    /**
     * Remove note rectangle from a piano key
     */
    removeNoteRect(step) {
        if (this.noteRects[step]) {
            this.noteRects[step].remove();
            delete this.noteRects[step];
        }
    }

    /**
     * Set reference note
     */
    setReferenceNote(step) {
        // Clear previous reference
        if (this.referenceNote !== null) {
            this.removeNoteRect(this.referenceNote);
        }

        this.referenceNote = step;
        this.addNoteRect(step, 'reference-note');

        // Scroll to show reference note
        this.scrollToNote(step);
    }

    /**
     * Clear all user placed notes
     */
    clearUserNotes() {
        this.userPlacedNotes.forEach(step => {
            this.removeNoteRect(step);
        });
        this.userPlacedNotes.clear();
    }

    /**
     * Get user placed notes
     */
    getUserNotes() {
        return Array.from(this.userPlacedNotes);
    }

    /**
     * Show feedback for correct/incorrect answer
     */
    showFeedback(correctSteps, isCorrect) {
        if (isCorrect) {
            this.userPlacedNotes.forEach(step => {
                if (this.noteRects[step]) {
                    this.noteRects[step].classList.remove('user-placed');
                    this.noteRects[step].classList.add('correct');
                }
            });
        } else {
            this.userPlacedNotes.forEach(step => {
                if (this.noteRects[step]) {
                    this.noteRects[step].classList.remove('user-placed');
                    this.noteRects[step].classList.add('incorrect');
                }
            });

            // Show correct answer
            correctSteps.forEach(step => {
                if (!this.userPlacedNotes.has(step)) {
                    this.addNoteRect(step, 'correct');
                }
            });
        }
    }

    /**
     * Reset all visual states
     */
    reset() {
        this.clearUserNotes();

        if (this.referenceNote !== null) {
            this.removeNoteRect(this.referenceNote);
            this.referenceNote = null;
        }

        // Clear all note rectangles
        Object.keys(this.noteRects).forEach(step => {
            this.removeNoteRect(parseInt(step));
        });
    }

    /**
     * Scroll to middle of piano roll
     */
    scrollToMiddle() {
        const middleKey = this.keys[Math.floor(this.numNotes / 2)];
        if (middleKey) {
            middleKey.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Scroll to specific note
     */
    scrollToNote(step) {
        if (this.keys[step]) {
            this.keys[step].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Highlight correct answer notes
     */
    highlightCorrectNotes(steps) {
        steps.forEach(step => {
            if (step >= 0 && step < this.numNotes) {
                this.addNoteRect(step, 'correct');
            }
        });
    }

    /**
     * Update EDO (re-render octave markers and labels)
     */
    updateEDO(edo) {
        this.edo = edo;

        // Update octave markers
        const middleCStep = 63;
        this.keys.forEach((key, i) => {
            const distanceFromMiddleC = i - middleCStep;

            if (distanceFromMiddleC % this.edo === 0) {
                key.classList.add('octave-marker');
            } else {
                key.classList.remove('octave-marker');
            }

            // Update label
            const label = key.querySelector('.key-label');
            if (label) {
                label.textContent = getNoteName(i, this.edo);
            }
        });
    }

    /**
     * Setup drag zoom functionality (Ableton-style)
     * Drag up/down on left sidebar to zoom in/out
     */
    setupDragZoom() {
        this.zoomSidebar.addEventListener('mousedown', (e) => {
            this.isDraggingZoom = true;
            this.startY = e.clientY;
            this.startKeyHeight = this.keyHeight;

            // Store the exact mouse Y position relative to wrapper for zoom pivot
            const wrapperRect = this.wrapper.getBoundingClientRect();
            this.zoomPivotY = e.clientY - wrapperRect.top + this.wrapper.scrollTop;
            this.mouseScreenY = e.clientY; // Store absolute screen position

            this.zoomSidebar.classList.add('dragging');
            document.body.classList.add('zooming');
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDraggingZoom) return;
            e.preventDefault();

            // Calculate zoom based on vertical drag
            // Drag up = zoom in (increase height), drag down = zoom out (decrease height)
            const deltaY = this.startY - e.clientY; // Negative when dragging down
            const sensitivity = 0.2; // Adjust zoom speed
            const newHeight = clamp(
                this.startKeyHeight + (deltaY * sensitivity),
                this.minKeyHeight,
                this.maxKeyHeight
            );

            if (newHeight !== this.keyHeight) {
                const oldHeight = this.keyHeight;
                const scaleFactor = newHeight / oldHeight;

                // Calculate scroll to keep the point under the ORIGINAL mouse position stationary
                const wrapperRect = this.wrapper.getBoundingClientRect();
                const mouseOffsetInWrapper = this.mouseScreenY - wrapperRect.top;

                // The content position that was under the mouse at click time
                const contentPositionUnderMouse = this.wrapper.scrollTop + mouseOffsetInWrapper;

                // After scaling, adjust scroll so same content position stays at original mouse Y
                const newScrollTop = contentPositionUnderMouse * scaleFactor - mouseOffsetInWrapper;

                this.keyHeight = newHeight;
                this.updateKeyHeights();

                // Apply new scroll position to keep content locked at original mouse position
                requestAnimationFrame(() => {
                    this.wrapper.scrollTop = newScrollTop;
                });
            }
        });

        document.addEventListener('mouseup', () => {
            if (this.isDraggingZoom) {
                this.isDraggingZoom = false;
                this.zoomSidebar.classList.remove('dragging');
                document.body.classList.remove('zooming');
            }
        });

        // Normal scroll wheel for scrolling up/down (not zooming)
        this.wrapper.addEventListener('wheel', (e) => {
            // Allow normal scrolling behavior
            // Don't prevent default
        }, { passive: true });
    }

    /**
     * Update all key heights based on current zoom level
     */
    updateKeyHeights() {
        this.keys.forEach(key => {
            key.style.height = this.keyHeight + 'px';
        });

        // Update sidebar label heights and font sizes (now in wrapper)
        const fontSize = Math.max(7, Math.min(12, this.keyHeight * 0.45));
        const sidebarLabels = this.wrapper.querySelectorAll('.sidebar-label');
        sidebarLabels.forEach(label => {
            label.style.height = this.keyHeight + 'px';
            label.style.fontSize = fontSize + 'px';
        });
    }

    /**
     * Setup toggle controls
     */
    setupToggleControls() {
        const blackKeysToggle = document.getElementById('toggle-black-keys');
        const hoverLabelsToggle = document.getElementById('toggle-hover-labels');

        if (blackKeysToggle) {
            blackKeysToggle.addEventListener('change', (e) => {
                this.showBlackKeys = e.target.checked;
                this.applyBlackKeyPattern();
            });
        }

        if (hoverLabelsToggle) {
            hoverLabelsToggle.addEventListener('change', (e) => {
                this.hoverLabelsOnly = e.target.checked;
                this.applyHoverLabels();
            });
        }
    }

    /**
     * Apply or remove black key pattern
     */
    applyBlackKeyPattern() {
        this.keys.forEach((key, i) => {
            if (this.showBlackKeys && this.isBlackKey(i)) {
                key.classList.add('black-key');
            } else {
                key.classList.remove('black-key');
            }
        });
    }

    /**
     * Apply or remove hover-only labels
     */
    applyHoverLabels() {
        const container = this.wrapper.parentElement;
        if (this.hoverLabelsOnly) {
            container.classList.add('hover-labels-only');
        } else {
            container.classList.remove('hover-labels-only');
        }
    }
}
