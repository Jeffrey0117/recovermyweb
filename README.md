# RecoverMyWeb 🔒

**Never lose your incognito tabs again.**

A Chrome extension that saves and restores your incognito window tabs - because accidentally closing that window with 20+ research tabs shouldn't ruin your day.

<p align="center">
  <img src="icon.png?v=2" alt="RecoverMyWeb Icon" width="200"/>
</p>

## 😫 The Problem

You know the pain:
- **Researching in incognito mode** with 15+ tabs open
- **Accidentally close the window** (wrong X button, keyboard shortcut mishap)
- **All your tabs are gone forever** - no history, no recovery
- **Start over from scratch** trying to remember what you were looking at

Chrome's built-in session restore doesn't work for incognito windows. Your tabs just... vanish.

## ✨ The Solution

RecoverMyWeb gives you a safety net:
- **One-click save** your current incognito session
- **One-click restore** all tabs exactly as they were
- **Survives Chrome restarts** - your saved sessions persist
- **Simple & fast** - no bloat, just works

## 🚀 Installation

### Option 1: Chrome Web Store (Coming Soon)
*Pending review*

### Option 2: Load Unpacked (Now)

1. **Download this repo**
   ```bash
   git clone https://github.com/YOUR_USERNAME/recovermyweb.git
   ```

2. **Open Chrome Extensions**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load Extension**
   - Click "Load unpacked"
   - Select the `recovermyweb` folder
   - Done!

## 📖 How to Use

### Save Your Session
1. Open incognito window with tabs you want to save
2. Click the RecoverMyWeb icon in your toolbar
3. Click **"Save Current Session"**
4. ✅ Session saved!

### Restore Your Tabs
1. Click the RecoverMyWeb icon
2. You'll see how many tabs were saved and when
3. Click **"Restore All Tabs"**
4. ✅ New incognito window opens with all your tabs!

### Clear Saved Session
- Click the RecoverMyWeb icon → **"Clear Snapshot"**

## 🎯 Features

- ✅ **Manual save** - Save your incognito tabs with one click
- ✅ **Quick restore** - Recover all tabs in seconds
- ✅ **Persistent storage** - Sessions survive Chrome restarts
- ✅ **Tab order preserved** - Tabs restore in the exact order you saved them
- ✅ **Pinned tabs** - Pinned state is preserved
- ✅ **Smart filtering** - Automatically skips `chrome://` system pages
- ✅ **Clean UI** - Simple, intuitive interface
- ✅ **Privacy-focused** - All data stays local, no cloud sync

## 🔒 Privacy

- **All data stored locally** in your browser
- **No external servers** - nothing leaves your computer
- **No tracking, no analytics** - we don't know you exist
- **Open source** - inspect the code yourself

## 🛠️ Technical Details

### Permissions Required
- **`tabs`** - Read tab URLs and titles
- **`storage`** - Save sessions locally

### Storage
- Maximum 3 sessions saved
- 7-day retention period
- Auto-cleanup of old sessions

### What Gets Saved
- Tab URLs
- Tab titles
- Tab order
- Pinned status
- Timestamp

### What Doesn't Get Saved
- Cookies or login sessions
- Form data
- Page content
- Browsing history

## 🚧 Known Limitations

- **Manual save only** - You must click "Save Current Session" before closing your window (auto-save on window close doesn't work reliably due to Chrome API limitations)
- **Cannot restore `chrome://` URLs** - Chrome security prevents extensions from opening system pages
- **Single session** - Only the most recent save is shown (though up to 3 are stored)
- **No cloud sync** - Sessions are device-local only

## 🗺️ Roadmap

Future features under consideration:
- [ ] Auto-save on window close (investigating workarounds)
- [ ] Multiple session history
- [ ] Selective tab restoration (checkboxes)
- [ ] Keyboard shortcut (Ctrl+Shift+R)
- [ ] Export/import sessions
- [ ] Session naming

## 🤝 Contributing

Issues and PRs welcome! This project was built to solve a real pain point - if you have ideas to make it better, let's hear them.

## 📄 License

MIT License - Use it, fork it, improve it.

## 🙏 Credits

Built out of frustration with losing incognito tabs one too many times.

---

**If this extension saved your tabs, give it a ⭐!**
