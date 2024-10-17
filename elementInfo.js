chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "displayElementInfo") {
    const htmlContent = document.getElementById('htmlContent');
    const previewContainer = document.getElementById('previewContainer');

    // 显示 HTML 内容
    htmlContent.textContent = request.html;

    // 创建预览
    previewContainer.innerHTML = '';
    const previewElement = document.createElement('div');
    previewElement.style.cssText = 'all: initial;';
    previewElement.innerHTML = request.html;
    previewContainer.appendChild(previewElement);
  }
});
