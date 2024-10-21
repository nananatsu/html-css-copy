chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Background script received message:", request);
  if (request.action === "download") {
    chrome.downloads.download({
      url: request.url,
      filename: 'exported_element.html',
      saveAs: true
    });
  } else if (request.action === "elementSelected") {
    // 转发消息到popup
    console.log("Forwarding elementSelected message to popup");
    chrome.runtime.sendMessage(request);
  } else if (request.action === "showElementInfo") {
    console.log("Creating new window for elementInfo");
    chrome.windows.create({
      url: chrome.runtime.getURL("elementInfo.html"),
      type: "popup",
      width: 800,
      height: 600
    }, function(window) {
      function listener(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tabId === window.tabs[0].id) {
          chrome.tabs.onUpdated.removeListener(listener);
          console.log("Sending displayElementInfo message to new tab:", tabId);
          chrome.tabs.sendMessage(tabId, {
            action: "displayElementInfo",
            html: request.html
          });
        }
      }
      chrome.tabs.onUpdated.addListener(listener);
    });
  }
});

// 保持弹出窗口打开
chrome.browserAction.onClicked.addListener(function(tab) {
  console.log("Browser action clicked for tab:", tab.id);
  chrome.browserAction.setPopup({tabId: tab.id, popup: 'popup.html'});
});
