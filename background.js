/**
 * Background Service Worker
 * Tracks incognito window tabs and saves snapshots
 */

// ============= Storage Functions (merged from storage.js) =============

const STORAGE_KEY = 'incognito_snapshots';
const MAX_SESSIONS = 3;
const MAX_RETENTION_DAYS = 7;

async function saveSnapshot(snapshot) {
  if (!snapshot || !snapshot.tabs || snapshot.tabs.length === 0) {
    throw new Error('Invalid snapshot: must contain tabs array');
  }

  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const snapshots = data[STORAGE_KEY] || [];
    snapshots.unshift(snapshot);
    const trimmedSnapshots = snapshots.slice(0, MAX_SESSIONS);
    const maxAge = Date.now() - (MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const filteredSnapshots = trimmedSnapshots.filter(s => s.closedAt > maxAge);

    await chrome.storage.local.set({
      [STORAGE_KEY]: filteredSnapshots
    });

    console.log(`Snapshot saved: ${snapshot.tabs.length} tabs`);
  } catch (error) {
    console.error('Failed to save snapshot:', error);
    throw error;
  }
}

async function getLatestSnapshot() {
  try {
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const snapshots = data[STORAGE_KEY] || [];
    return snapshots.length > 0 ? snapshots[0] : null;
  } catch (error) {
    console.error('Failed to get latest snapshot:', error);
    throw error;
  }
}

async function clearSnapshots() {
  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    console.log('All snapshots cleared');
  } catch (error) {
    console.error('Failed to clear snapshots:', error);
    throw error;
  }
}

function sanitizeTab(tab) {
  if (!tab || !tab.url) {
    return null;
  }

  if (tab.url.startsWith('chrome://') ||
      tab.url.startsWith('chrome-extension://')) {
    return null;
  }

  return {
    id: tab.id,
    url: tab.url,
    title: sanitizeString(tab.title || 'Untitled'),
    index: tab.index || 0,
    pinned: tab.pinned || false,
    timestamp: Date.now()
  };
}

function sanitizeString(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============= Background Service Worker Logic =============

const incognitoSessions = new Map();
let autoSaveTimer = null;
const AUTO_SAVE_DELAY = 5000;

chrome.runtime.onInstalled.addListener(() => {
  console.log('RecoverMyWeb extension installed');
});

chrome.tabs.onCreated.addListener(async (tab) => {
  if (!tab.incognito) {
    return;
  }

  console.log(`Incognito tab created: ${tab.id}`);

  const sanitizedTab = sanitizeTab(tab);
  if (!sanitizedTab) {
    return;
  }

  if (!incognitoSessions.has(tab.windowId)) {
    incognitoSessions.set(tab.windowId, {
      windowId: tab.windowId,
      tabs: new Map()
    });
  }

  const session = incognitoSessions.get(tab.windowId);
  session.tabs.set(tab.id, sanitizedTab);

  scheduleAutoSave(tab.windowId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!tab.incognito) {
    return;
  }

  const session = incognitoSessions.get(tab.windowId);
  if (!session) {
    return;
  }

  if (changeInfo.url || changeInfo.title) {
    const sanitizedTab = sanitizeTab(tab);
    if (sanitizedTab) {
      session.tabs.set(tabId, sanitizedTab);
      scheduleAutoSave(tab.windowId);
    }
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const session = incognitoSessions.get(removeInfo.windowId);
  if (!session) {
    return;
  }

  console.log(`Incognito tab removed: ${tabId}`);
  session.tabs.delete(tabId);

  if (!removeInfo.isWindowClosing) {
    scheduleAutoSave(removeInfo.windowId);
  }
});

chrome.windows.onRemoved.addListener(async (windowId) => {
  const session = incognitoSessions.get(windowId);
  if (!session) {
    return;
  }

  console.log(`Incognito window closed: ${windowId}`);

  const tabs = Array.from(session.tabs.values());

  if (tabs.length > 0) {
    const snapshot = {
      sessionId: `${windowId}_${Date.now()}`,
      windowId: windowId,
      tabs: tabs.sort((a, b) => a.index - b.index),
      closedAt: Date.now()
    };

    try {
      await saveSnapshot(snapshot);
      console.log(`Snapshot saved for window ${windowId}: ${tabs.length} tabs`);
    } catch (error) {
      console.error('Failed to save snapshot on window close:', error);
    }
  }

  incognitoSessions.delete(windowId);

  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = null;
  }
});

function scheduleAutoSave(windowId) {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer);
  }

  autoSaveTimer = setTimeout(async () => {
    const session = incognitoSessions.get(windowId);
    if (!session || session.tabs.size === 0) {
      return;
    }

    const tabs = Array.from(session.tabs.values());
    const snapshot = {
      sessionId: `${windowId}_${Date.now()}`,
      windowId: windowId,
      tabs: tabs.sort((a, b) => a.index - b.index),
      closedAt: Date.now()
    };

    try {
      await saveSnapshot(snapshot);
      console.log(`Auto-saved snapshot for window ${windowId}: ${tabs.length} tabs`);
    } catch (error) {
      console.error('Failed to auto-save snapshot:', error);
    }
  }, AUTO_SAVE_DELAY);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLatestSnapshot') {
    getLatestSnapshot()
      .then(snapshot => sendResponse({ success: true, snapshot }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'restoreTabs') {
    restoreTabs(request.snapshot)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'clearSnapshots') {
    clearSnapshots()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function restoreTabs(snapshot) {
  if (!snapshot || !snapshot.tabs || snapshot.tabs.length === 0) {
    throw new Error('No tabs to restore');
  }

  try {
    const window = await chrome.windows.create({
      incognito: true,
      focused: true
    });

    const defaultTabs = await chrome.tabs.query({ windowId: window.id });
    if (defaultTabs.length > 0) {
      await chrome.tabs.remove(defaultTabs[0].id);
    }

    for (const tab of snapshot.tabs) {
      try {
        await chrome.tabs.create({
          windowId: window.id,
          url: tab.url,
          pinned: tab.pinned,
          active: false
        });
      } catch (error) {
        console.error(`Failed to restore tab ${tab.url}:`, error);
      }
    }

    const tabs = await chrome.tabs.query({ windowId: window.id });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
    }

    console.log(`Restored ${snapshot.tabs.length} tabs`);
  } catch (error) {
    console.error('Failed to restore tabs:', error);
    throw error;
  }
}
