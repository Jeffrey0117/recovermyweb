/**
 * Popup UI Logic
 * Handles user interactions and tab restoration
 */

const STORAGE_KEY = 'incognito_snapshots';

// State management
let currentSnapshot = null;

// DOM elements
const states = {
  loading: document.getElementById('loading-state'),
  noSnapshot: document.getElementById('no-snapshot-state'),
  snapshot: document.getElementById('snapshot-state'),
  success: document.getElementById('success-state'),
  error: document.getElementById('error-state')
};

const elements = {
  tabCount: document.getElementById('tab-count'),
  closedTime: document.getElementById('closed-time'),
  restoreBtn: document.getElementById('restore-btn'),
  clearBtn: document.getElementById('clear-btn'),
  closeBtn: document.getElementById('close-btn'),
  retryBtn: document.getElementById('retry-btn'),
  errorMessage: document.getElementById('error-message'),
  saveNowBtn: document.getElementById('save-now-btn')
};

/**
 * Initialize popup
 */
async function init() {
  showState('loading');

  try {
    // 直接从 storage 读取（不通过 background）
    const data = await chrome.storage.local.get(STORAGE_KEY);
    const snapshots = data[STORAGE_KEY] || [];

    currentSnapshot = snapshots.length > 0 ? snapshots[0] : null;

    if (!currentSnapshot || !currentSnapshot.tabs || currentSnapshot.tabs.length === 0) {
      showState('noSnapshot');
    } else {
      displaySnapshot(currentSnapshot);
      showState('snapshot');
    }
  } catch (error) {
    console.error('Initialization error:', error);
    showError(error.message);
  }
}

/**
 * Display snapshot information
 */
function displaySnapshot(snapshot) {
  elements.tabCount.textContent = snapshot.tabs.length;
  elements.closedTime.textContent = formatTimestamp(snapshot.closedAt);
}

/**
 * Format timestamp to relative time
 */
function formatTimestamp(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  return 'Just now';
}

/**
 * Show specific state
 */
function showState(stateName) {
  Object.keys(states).forEach(key => {
    states[key].classList.add('hidden');
  });

  if (states[stateName]) {
    states[stateName].classList.remove('hidden');
  }
}

/**
 * Show error state
 */
function showError(message) {
  elements.errorMessage.textContent = message;
  showState('error');
}

/**
 * Restore tabs - 直接在 popup 里恢复
 */
async function restoreTabs() {
  if (!currentSnapshot) {
    showError('No snapshot available');
    return;
  }

  elements.restoreBtn.disabled = true;
  elements.restoreBtn.textContent = 'Restoring...';

  try {
    console.log(`开始恢复 ${currentSnapshot.tabs.length} 个标签`);

    // 创建新的无痕窗口
    const window = await chrome.windows.create({
      incognito: true,
      focused: true,
      url: currentSnapshot.tabs[0].url  // 直接用第一个标签的 URL
    });
    console.log(`✓ 第1个标签: ${currentSnapshot.tabs[0].url}`);

    // 恢复剩余的标签页（从第二个开始）
    for (let i = 1; i < currentSnapshot.tabs.length; i++) {
      const tab = currentSnapshot.tabs[i];
      try {
        await chrome.tabs.create({
          windowId: window.id,
          url: tab.url,
          pinned: tab.pinned,
          active: false
        });
        console.log(`✓ 第${i + 1}个标签: ${tab.url}`);
      } catch (error) {
        console.error(`✗ 第${i + 1}个标签失败: ${tab.url}`, error);
      }
    }

    console.log('恢复完成');

    // 处理第一个标签的 pinned 状态
    if (currentSnapshot.tabs[0].pinned) {
      const tabs = await chrome.tabs.query({ windowId: window.id });
      if (tabs.length > 0) {
        await chrome.tabs.update(tabs[0].id, { pinned: true });
      }
    }

    // 激活第一个标签页
    const tabs = await chrome.tabs.query({ windowId: window.id });
    if (tabs.length > 0) {
      await chrome.tabs.update(tabs[0].id, { active: true });
    }

    showState('success');

    // 2秒后自动关闭弹窗
    setTimeout(() => {
      window.close();
    }, 2000);
  } catch (error) {
    console.error('Restore error:', error);
    showError(error.message);
  } finally {
    elements.restoreBtn.disabled = false;
    elements.restoreBtn.textContent = 'Restore All Tabs';
  }
}

/**
 * Clear snapshots - 直接操作 storage
 */
async function clearSnapshotsHandler() {
  if (!confirm('Are you sure you want to clear all saved snapshots?')) {
    return;
  }

  elements.clearBtn.disabled = true;
  elements.clearBtn.textContent = 'Clearing...';

  try {
    await chrome.storage.local.remove(STORAGE_KEY);
    currentSnapshot = null;
    showState('noSnapshot');
  } catch (error) {
    console.error('Clear error:', error);
    showError(error.message);
  } finally {
    elements.clearBtn.disabled = false;
    elements.clearBtn.textContent = 'Clear Snapshot';
  }
}

/**
 * Save current incognito session manually
 */
async function saveCurrentSession() {
  elements.saveNowBtn.disabled = true;
  elements.saveNowBtn.textContent = 'Saving...';

  try {
    const windows = await chrome.windows.getAll({ windowTypes: ['normal'] });
    const incognitoWindow = windows.find(w => w.incognito);

    if (!incognitoWindow) {
      showError('No incognito window found. Please open one first.');
      return;
    }

    const tabs = await chrome.tabs.query({ windowId: incognitoWindow.id });
    const validTabs = tabs
      .filter(t => !t.url.startsWith('chrome://') && !t.url.startsWith('chrome-extension://'))
      .map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        index: tab.index,
        pinned: tab.pinned,
        timestamp: Date.now()
      }));

    if (validTabs.length === 0) {
      showError('No valid tabs to save');
      return;
    }

    const snapshot = {
      sessionId: `${incognitoWindow.id}_${Date.now()}`,
      windowId: incognitoWindow.id,
      tabs: validTabs,
      closedAt: Date.now()
    };

    await chrome.storage.local.set({ incognito_snapshots: [snapshot] });

    // Refresh display
    currentSnapshot = snapshot;
    displaySnapshot(currentSnapshot);
    showState('snapshot');
  } catch (error) {
    console.error('Save error:', error);
    showError(error.message);
  } finally {
    elements.saveNowBtn.disabled = false;
    elements.saveNowBtn.textContent = 'Save Current Session';
  }
}

/**
 * Event listeners
 */
elements.restoreBtn.addEventListener('click', restoreTabs);
elements.clearBtn.addEventListener('click', clearSnapshotsHandler);
elements.closeBtn.addEventListener('click', () => window.close());
elements.retryBtn.addEventListener('click', init);
elements.saveNowBtn.addEventListener('click', saveCurrentSession);

// Initialize on load
document.addEventListener('DOMContentLoaded', init);
