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
      navigator.clipboard.writeText(request.html).then(function() {
        // 创建一个临时的成功消息元素
        const successMessage = document.createElement('span');
        successMessage.textContent = '复制成功！';
        successMessage.style.cssText = `
          color: green;
          margin-left: 10px;
          transition: opacity 0.5s ease-in-out;
        `;
        copyButton.parentNode.insertBefore(successMessage, copyButton.nextSibling);

        // 2秒后淡出并移除成功消息
        setTimeout(() => {
          successMessage.style.opacity = '0';
          setTimeout(() => {
            successMessage.remove();
          }, 500);
        }, 2000);
      }, function(err) {
        console.error('无法复制文本: ', err);
        // 如果复制失败，我们仍然显示一个错误消息
        const errorMessage = document.createElement('span');
        errorMessage.textContent = '复制失败，请重试';
        errorMessage.style.cssText = `
          color: red;
          margin-left: 10px;
        `;
        copyButton.parentNode.insertBefore(errorMessage, copyButton.nextSibling);
        setTimeout(() => errorMessage.remove(), 3000);
      });
    });
  }
});
