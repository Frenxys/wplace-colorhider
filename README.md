# WPlace Color Hider

A Firefox extension that extracts and displays in real-time all colors from the [wplace.live](https://wplace.live) palette with the ability to disable them directly from the interface.

## Features

- ✨ Extracts colors in real-time from the wplace.live DOM
- 🎨 Integrated button on the page to manage colors
- 👁️ Elegant modal with visual color preview
- 🔄 Toggle checkboxes to enable/disable individual colors
- 💾 State persistence with browser.storage
- ⚡ Disabled colors instantly disappear from the page
- 🌍 Fully English interface

## Extension Files

```
wplace-colorhider/
├── manifest.json      # Extension configuration (Manifest v3)
├── popup.html        # Popup UI
├── popup.js          # Popup logic
├── styles.css        # CSS styles
├── content.js        # Content script (extracts and manages colors)
├── background.js     # Background script
└── README.md         # This file
```

## Installation

1. Open Firefox
2. Go to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from this folder
5. The extension will be activated on wplace.live

## How to Use

### Method 1: Button on the page (recommended)

1. Go to [wplace.live](https://wplace.live)
2. In the drawing toolbar, next to the "Edit Opacity" button, you'll find the button with the eye icon
3. Click the button to open the color modal
4. Enable/disable colors with checkboxes
5. Disabled colors will instantly disappear from the palette

### Method 2: Extension popup

1. Click the extension icon in the toolbar
2. View all available colors on wplace.live
3. Enable/disable colors as you wish
4. Changes are applied instantly

## Key Features

### Real-time Extraction
The extension extracts colors from the wplace.live DOM by searching for elements with the `data-tip` attribute and `tooltip` class.

### Selective Disabling
You can disable individual colors through:
- The modal on the page (eye button)
- The extension popup

### Quick Actions
- **✓ All**: Enable all colors
- **✗ None**: Disable all colors

### Persistence
The state of disabled colors is saved in `browser.storage.local` and persists between sessions.

## Development

### Modifying the Extension

1. Modify the files as needed
2. In `about:debugging#/runtime/this-firefox`, click the "Reload" button
3. Go back to wplace.live and reload the page

### Debugging

Open the Firefox console (F12) to see debug messages from the extension

## License

MIT
