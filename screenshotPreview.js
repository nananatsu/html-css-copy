chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "displayScreenshot") {
    const screenshotImage = document.getElementById('screenshotImage');
    cropScreenshot(request.imageUrl, request.area, screenshotImage, request.format);
  } else if (request.action === "updateProgress") {
    updateProgress(request.progress);
  } else if (request.action === "aiResponseReceived") {
    window.close(); // 关闭当前窗口
  } else if (request.action === "errorOccurred") {
    showError(request.error);
  }
});

function cropScreenshot(imageUrl, area, imgElement, format) {
  const img = new Image();
  img.onload = function() {
    const canvas = document.createElement('canvas');
    canvas.width = area.width;
    canvas.height = area.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, area.width, area.height);
    imgElement.src = canvas.toDataURL('image/' + (format || 'png'));
  };
  img.src = imageUrl;
}

document.getElementById('generateButton').addEventListener('click', function() {
  const screenshotImage = document.getElementById('screenshotImage');
  const generateButton = document.getElementById('generateButton');
  const progressContainer = document.getElementById('progressContainer');

  generateButton.disabled = true;
  progressContainer.style.display = 'block';

  chrome.runtime.sendMessage({
    action: "sendImageToAI",
    imageDataUrl: screenshotImage.src
  });
});

function updateProgress(progress) {
  const progressContainer = document.getElementById('progressContainer');
  if (progress === 100) {
    progressContainer.style.display = 'none';
  } else {
    progressContainer.style.display = 'block';
  }
}

function showError(errorMessage) {
  const generateButton = document.getElementById('generateButton');
  const progressContainer = document.getElementById('progressContainer');
  const aiResponse = document.getElementById('aiResponse');

  generateButton.disabled = false;
  progressContainer.style.display = 'none';
  aiResponse.textContent = "错误: " + errorMessage;
  aiResponse.style.display = 'block';
  aiResponse.style.color = 'red';
}
