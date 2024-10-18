let selectedTabId = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup DOM loaded");
  const selectButton = document.getElementById('selectElement');
  const exportButton = document.getElementById('exportElement');

  selectButton.addEventListener('click', function() {
    console.log("Select button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "selectElement"});
    });
    window.close(); // 关闭弹出窗口
  });

  exportButton.addEventListener('click', function() {
    console.log("Export button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "exportElement"});
    });
    window.close(); // 关闭弹出窗口
  });
});

// 保持弹出窗口打开
chrome.action.onClicked.addListener((tab) => {
  chrome.action.setPopup({tabId: tab.id, popup: 'popup.html'});
});
