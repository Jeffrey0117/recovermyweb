# RecoverMyWeb - Chrome Extension

Chrome Extension to track and restore incognito window tabs, persisting across Chrome restarts.

## Features

- **Automatic Tracking**: Monitors all tabs in incognito windows
- **Persistent Storage**: Survives Chrome restarts using chrome.storage.local
- **One-Click Restore**: Restore all tabs from last incognito session
- **Clean UI**: Simple popup interface
- **Smart Filtering**: Excludes chrome:// and extension URLs
- **Auto-Save**: Saves snapshots every 5 seconds while window is open

## Installation

### Option 1: Load Unpacked Extension (Development)

1. **Create Icon** (Required):
   - Convert `icon.svg` to PNG format at these sizes:
     - 128x128 pixels
     - 48x48 pixels
     - 16x16 pixels
   - Use an online converter like [SVG to PNG Converter](https://svgtopng.com/)
   - Save all as `icon.png` (Chrome will use the appropriate size)
   - OR use any 128x128 PNG icon and rename it to `icon.png`

2. **Open Chrome Extensions**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top-right)

3. **Load Extension**:
   - Click "Load unpacked"
   - Select the `C:\recovermyweb` directory
   - Extension should appear in toolbar

### Option 2: Package as .crx (Distribution)

1. Create icon as described above
2. In `chrome://extensions/`, click "Pack extension"
3. Select the `C:\recovermyweb` directory
4. Chrome will generate `.crx` file for distribution

## Usage

1. **Open Incognito Window**:
   - Press `Ctrl+Shift+N` (Windows/Linux) or `Cmd+Shift+N` (Mac)
   - Open multiple tabs as needed

2. **Close Incognito Window**:
   - Extension automatically saves snapshot

3. **Restore Tabs**:
   - Click RecoverMyWeb icon in toolbar
   - Click "Restore All Tabs"
   - New incognito window opens with all tabs

## File Structure

```
recovermyweb/
├── manifest.json          # Extension configuration
├── background.js          # Service worker (tab tracking)
├── storage.js            # Storage utilities
├── popup.html            # UI structure
├── popup.js              # UI logic
├── styles.css            # Styling
├── icon.svg              # Icon source (convert to PNG)
├── icon.png              # Extension icon (YOU NEED TO CREATE THIS)
└── README.md             # This file
```

## Technical Details

### Permissions

- **tabs**: Access to tab information (URL, title, state)
- **storage**: Persistent local storage for snapshots

### Storage Schema

```typescript
interface TabSnapshot {
  id: string
  url: string
  title: string
  index: number
  pinned: boolean
  timestamp: number
}

interface SessionSnapshot {
  sessionId: string
  windowId: number
  tabs: TabSnapshot[]
  closedAt: number
}
```

### Data Retention

- Maximum 3 sessions stored
- Maximum 7 days retention
- Auto-cleanup on save

### Security Features

- URL filtering (excludes chrome:// and chrome-extension://)
- XSS prevention (HTML entity encoding)
- No sensitive data storage (no form data, credentials)

## Troubleshooting

### Extension Not Loading

- Verify `icon.png` exists in directory
- Check Chrome console for errors (`chrome://extensions/` → "Inspect views: service worker")
- Ensure manifest.json is valid JSON

### Tabs Not Restoring

- Check if URLs are allowed (chrome:// URLs cannot be restored)
- Verify snapshot exists (open popup to check)
- Check background service worker logs

### Snapshot Not Saving

- Ensure incognito window has trackable tabs
- Check storage quota: `chrome://settings/content/all?search=storage`
- Verify extension has storage permission

## Development

### Debug Service Worker

1. Go to `chrome://extensions/`
2. Find RecoverMyWeb
3. Click "Inspect views: service worker"
4. Console shows all background logs

### Debug Popup

1. Click extension icon to open popup
2. Right-click popup → "Inspect"
3. DevTools opens for popup context

### Clear Storage

```javascript
// In popup or background console:
chrome.storage.local.clear()
```

## Known Limitations

- Cannot restore `chrome://` or `chrome-extension://` URLs
- Requires manual click to restore (no automatic restore)
- Single session restoration (not full history)
- No cloud sync (local storage only)

## Future Enhancements

- Multiple session history browser
- Selective tab restoration (checkboxes)
- Keyboard shortcut for restore
- Export/import sessions
- Cloud sync across devices

## License

MIT License - Feel free to modify and distribute

## Version

1.0.0 - Initial release

## Support

For issues or questions, please check:
- Background service worker console for errors
- Chrome extension documentation: https://developer.chrome.com/docs/extensions/
