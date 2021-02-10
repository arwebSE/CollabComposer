# CollabComposer

[This project is based on TheoryTracker](https://hlorenzi.github.io/theorytracker/)

Work in progress

## How to use

### General usage:

* Use the middle or right mouse buttons to pan.
* Hold <kbd>A</kbd> to draw elements with the mouse.
* Right-click on an element to change its properties.
  * Do a long right-click for a context menu with more commands.
* Double-click on a note block to edit its notes.
  * Click on "Project Root" on the breadcrumb bar to exit note editing mode.

* Press <kbd>Space</kbd> to toggle playback starting from the cursor.
* Press <kbd>Esc</kbd> to rewind.
* Use <kbd>Backspace</kbd> to delete incrementally.
* Use <kbd>Ctrl</kbd> + <kbd>Z</kbd> to undo, and <kbd>Ctrl</kbd> + <kbd>Y</kbd>
or <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>Z</kbd> to redo.

* Also use <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd><kbd>4</kbd><kbd>5</kbd><kbd>6</kbd><kbd>7</kbd>
to create notes and chords.

### When elements are selected:

* Use <kbd>←</kbd><kbd>→</kbd> to move.
  * Combine with <kbd>Ctrl</kbd> for faster movement.
* Use <kbd>↑</kbd><kbd>↓</kbd> to change the pitch of notes, and the root of chords.
  * Combine with <kbd>Ctrl</kbd> to change pitch by octaves.
  * Combine with <kbd>Shift</kbd> to change pitch chromatically.
* Also use <kbd>,</kbd><kbd>.</kbd> to change pitch chromatically.
* Use <kbd>Shift</kbd> + <kbd>←</kbd><kbd>→</kbd> to stretch.
* Hold <kbd>Alt</kbd> then drag with the mouse to duplicate.

* Press <kbd>Enter</kbd> to unselect all.
* Press <kbd>Delete</kbd> to delete.

* Use <kbd>Ctrl</kbd> + <kbd>X</kbd>, <kbd>C</kbd>, or <kbd>V</kbd> for the usual
cut/copy/paste commands.

## Building from source

Install npm dependencies with `npm install`, then perform a build
with `npm run build`. You can also run `npm run watch` to work locally.

Then, run `npm start` or any other simple HTTP web server from
the repository folder, and navigate to `http://127.0.0.1`.