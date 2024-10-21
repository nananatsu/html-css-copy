let selectedTabId = null;

document.addEventListener('DOMContentLoaded', function() {
  console.log("Popup DOM loaded");
  var selectButton = document.getElementById('selectElement');
  var exportButton = document.getElementById('exportElement');

  selectButton.addEventListener('click', function() {
    console.log("Select button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log("Sending selectElement message to tab:", tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {action: "selectElement"}, function(response) {
        console.log("Response from content script:", response);
      });
    });
    // window.close(); // 暂时注释掉这行，以便我们可以看到console输出
  });

  exportButton.addEventListener('click', function() {
    console.log("Export button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log("Sending exportElement message to tab:", tabs[0].id);
      chrome.tabs.sendMessage(tabs[0].id, {action: "exportElement"}, function(response) {
        console.log("Response from content script:", response);
      });
    });
    // window.close(); // 暂时注释掉这行，以便我们可以看到console输出
  });
});
