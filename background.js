chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
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
    showElementInfo(request.html);
  } else if (request.action === "captureScreenshot") {
    chrome.tabs.captureVisibleTab(null, { format: request.format || 'png' }, function (screenshotUrl) {
      showScreenshotPreview(screenshotUrl, request.area, request.format);
    });
  } else if (request.action === "sendImageToAI") {
    sendImageToAIService(request.imageDataUrl);
  }
});

function showScreenshotPreview(screenshotUrl, area, format) {
  chrome.windows.create({
    url: chrome.runtime.getURL("screenshotPreview.html"),
    type: "popup",
    width: 800,
    height: 600
  }, function (window) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === window.tabs[0].id) {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(window.tabs[0].id, {
          action: "displayScreenshot",
          imageUrl: screenshotUrl,
          area: area,
          format: format
        });
      }
    });
  });
}

function sendImageToAIService(imageDataUrl) {
  chrome.storage.sync.get(['configurations', 'currentConfig'], function (result) {
    const configurations = result.configurations || {};
    const currentConfig = result.currentConfig || Object.keys(configurations)[0];
    const config = configurations[currentConfig];

    if (!config) {
      sendErrorMessage('未找到有效配置，请在设置中创建或选择一个配置');
      return;
    }

    const {
      aiServiceUrl,
      apiKey,
      modelName,
      messageTemplateType,
      customMessageTemplate,
      imageHosting,
      imgbbKey
    } = config;

    if (!aiServiceUrl || !apiKey || !modelName || !messageTemplateType) {
      sendErrorMessage('配置信息不完整，请检查设置');
      return;
    }

    if (imageHosting === 'imgbb') {
      if (!imgbbKey) {
        sendErrorMessage('请在当前配置中设置 ImgBB API Key');
        return;
      }
      uploadToImgBB(imageDataUrl, imgbbKey)
        .then(imageUrl => sendAIRequest(aiServiceUrl, apiKey, modelName, messageTemplateType, customMessageTemplate, imageUrl))
        .catch(error => {
          console.error('Error uploading image:', error);
          sendErrorMessage('上传图片失败，请重试');
        });
    } else {
      sendAIRequest(aiServiceUrl, apiKey, modelName, messageTemplateType, customMessageTemplate, imageDataUrl);
    }
  });
}

function uploadToImgBB(imageDataUrl, apiKey) {
  const formData = new FormData();
  formData.append('image', imageDataUrl.split(',')[1]);

  return fetch('https://api.imgbb.com/1/upload?key=' + apiKey, {
    method: 'POST',
    body: formData
  })
    .then(response => response.json())
    .then(result => {
      if (result.data && result.data.url) {
        return result.data.url;
      } else {
        throw new Error('ImgBB upload failed');
      }
    });
}

function sendAIRequest(aiServiceUrl, apiKey, modelName, messageTemplateType, customMessageTemplate, imageUrl) {
  let message;
  if (messageTemplateType === 'OpenAI') {
    message = [
      {
        "type": "image_url",
        "image_url": {
          "url": imageUrl
        }
      },
      {
        "type": "text",
        "text": "根据给定的图片，请生成一个等效的 HTML 和 CSS 代码。要求 CSS 代码通过 <style> 标签内联到 HTML 中。请确保生成的代码能够准确复现图片中的布局、样式和视觉效果。"
      }
    ];
  } else {
    try {
      message = JSON.parse(customMessageTemplate);
      // 替换 JSON 中的 {image} 占位符
      JSON.stringify(message, (key, value) => {
        if (typeof value === 'string') {
          return value.replace('{image}', imageUrl);
        }
        return value;
      });
    } catch (error) {
      console.log('自定义消息模板不是有效的 JSON 格式，将作为字符串处理');
      message = customMessageTemplate.replace('{image}', imageUrl);
    }
  }

  fetch(aiServiceUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "你是一位专业的前端开发工程师，擅长将设计稿转换为语义化且高效的HTML和CSS代码。"
        },
        {
          role: "user",
          content: message
        }
      ],
      frequency_penalty: 0,
      max_tokens: 1024,
      temperature: 0.7,
      top_k: 50,
      top_p: 0.7
    }),
  })
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          throw new Error(text || `HTTP error! status: ${response.status}`);
        });
      }
      return response.json();
    })
    .then(data => {
      if (data.choices && data.choices.length > 0) {
        const generatedContent = data.choices[0].message.content;
        const extractedHtml = extractHtmlFromResponse(generatedContent);
        if (extractedHtml) {
          showGeneratedElementInfo(extractedHtml);
          sendAIResponse(); // 只发送成功消息，不包含响应内容
        } else {
          throw new Error('无法从 AI 响应中提取 HTML 代码');
        }
      } else {
        throw new Error('AI 服务返回的数据格式不正确');
      }
    })
    .catch(error => {
      console.error('Error:', error);
      sendErrorMessage('生成失败，请重试: ' + error.message);
    });
}

function extractHtmlFromResponse(response) {
  const htmlRegex = /```html([\s\S]*?)```/;
  const match = response.match(htmlRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function inlineCssToHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // 查找所有的 <style> 标签
  const styleTags = doc.getElementsByTagName('style');

  if (styleTags.length === 0) {
    // 如果没有 <style> 标签，说明 CSS 可能已经内联，直接返回原 HTML
    return html;
  }

  // 将所有 <style> 标签中的 CSS 规则应用到对应的元素上
  Array.from(styleTags).forEach(styleTag => {
    const cssRules = styleTag.sheet.cssRules;
    Array.from(cssRules).forEach(rule => {
      if (rule.type === CSSRule.STYLE_RULE) {
        const elements = doc.querySelectorAll(rule.selectorText);
        elements.forEach(element => {
          element.style.cssText += rule.style.cssText;
        });
      }
    });
    // 移除 <style> 标签
    styleTag.remove();
  });

  // 返回内联后的 HTML
  return doc.body.innerHTML;
}

function updateProgress(progress) {
  chrome.runtime.sendMessage({
    action: "updateProgress",
    progress: progress
  });
}

function sendAIResponse() {
  chrome.runtime.sendMessage({
    action: "aiResponseReceived"
  });
}

function sendErrorMessage(message) {
  chrome.runtime.sendMessage({
    action: "errorOccurred",
    error: message
  });
}

function showGeneratedElementInfo(html) {
  chrome.windows.create({
    url: chrome.runtime.getURL("elementInfo.html"),
    type: "popup",
    width: 800,
    height: 600
  }, function (window) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === window.tabs[0].id) {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(window.tabs[0].id, {
          action: "displayElementInfo",
          html: html
        });
      }
    });
  });
}

function showElementInfo(html) {
  chrome.windows.create({
    url: chrome.runtime.getURL("elementInfo.html"),
    type: "popup",
    width: 800,
    height: 600
  }, function (window) {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === 'complete' && tabId === window.tabs[0].id) {
        chrome.tabs.onUpdated.removeListener(listener);
        chrome.tabs.sendMessage(window.tabs[0].id, {
          action: "displayElementInfo",
          html: html
        });
      }
    });
  });
}
