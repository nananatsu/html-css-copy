let selectedTabId = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup DOM loaded");
  const selectButton = document.getElementById('selectElement');
  const exportButton = document.getElementById('exportElement');
  const smartGenerateButton = document.getElementById('smartGenerate');
  const settingsButton = document.getElementById('settings');

  selectButton.addEventListener('click', function() {
    console.log("Select button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "selectElement"});
    });
    window.close();
  });

  exportButton.addEventListener('click', function() {
    console.log("Export button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "exportElement"});
    });
    window.close();
  });

  smartGenerateButton.addEventListener('click', function() {
    console.log("Smart Generate button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "smartGenerate"});
    });
    window.close();
  });

  settingsButton.addEventListener('click', function() {
    console.log("Settings button clicked");
    chrome.tabs.create({url: 'settings.html'});
    window.close();
  });
});

// 保持弹出窗口打开
chrome.action.onClicked.addListener((tab) => {
  chrome.action.setPopup({tabId: tab.id, popup: 'popup.html'});
});
