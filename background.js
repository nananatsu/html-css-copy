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
    chrome.runtime.sendMessage(request);
  } else if (request.action === "showElementInfo") {
    chrome.windows.create({
      url: chrome.runtime.getURL("elementInfo.html"),
      type: "popup",
      width: 800,
      height: 600
    }, function(window) {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === window.tabs[0].id) {
          chrome.tabs.onUpdated.removeListener(listener);
          chrome.tabs.sendMessage(window.tabs[0].id, {
            action: "displayElementInfo",
            html: request.html
          });
        }
      });
    });
  }
});
