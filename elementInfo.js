chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "displayElementInfo") {
    const htmlContent = document.getElementById('htmlContent');
    const previewContainer = document.getElementById('previewContainer');
    const copyButton = document.getElementById('copyButton');

    // 显示 HTML 内容
    htmlContent.textContent = request.html;

    // 创建预览
    previewContainer.innerHTML = '';
    const previewElement = document.createElement('div');
    previewElement.style.cssText = 'all: initial;';
    previewElement.innerHTML = request.html;
    previewContainer.appendChild(previewElement);

    // 添加复制功能
    copyButton.addEventListener('click', function() {
      copyToClipboard(request.html);
    });
  }
});

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    // 使用 Clipboard API
    navigator.clipboard.writeText(text).then(function() {
      showMessage('复制成功！', 'success');
    }, function(err) {
      console.error('Clipboard API 复制失败: ', err);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    // 回退到其他方法
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  
  // 避免滚动到底部
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand('copy');
    const msg = successful ? '复制成功！' : '复制失败，请重试';
    showMessage(msg, successful ? 'success' : 'error');
  } catch (err) {
    console.error('Fallback: 复制失败', err);
    showMessage('复制失败，请重试', 'error');
  }

  document.body.removeChild(textArea);
}

function showMessage(message, type) {
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  messageElement.style.cssText = `
    margin-left: 10px;
    transition: opacity 0.5s ease-in-out;
    color: ${type === 'success' ? 'green' : 'red'};
  `;
  
  const copyButton = document.getElementById('copyButton');
  copyButton.parentNode.insertBefore(messageElement, copyButton.nextSibling);

  setTimeout(() => {
    messageElement.style.opacity = '0';
    setTimeout(() => {
      messageElement.remove();
    }, 500);
  }, 2000);
}
