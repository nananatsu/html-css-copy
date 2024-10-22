document.addEventListener('DOMContentLoaded', function() {
  const aiServiceUrlInput = document.getElementById('aiServiceUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const modelNameInput = document.getElementById('modelName');
  const messageTemplateTypeSelect = document.getElementById('messageTemplateType');
  const messageTemplateInput = document.getElementById('messageTemplate');
  const customMessageTemplateDiv = document.getElementById('customMessageTemplate');
  const imageHostingSelect = document.getElementById('imageHosting');
  const imgbbApiKeyInput = document.getElementById('imgbbKey');
  const imgbbApiKeyDiv = document.getElementById('imgbbApiKey');
  const saveButton = document.getElementById('saveSettings');

  const templates = {
    OpenAI: JSON.stringify([
      {
        "type": "image_url",
        "image_url": {
          "url": "{image}"
        }
      },
      {
        "type": "text",
        "text": "根据给定的图片，请生成一个等效的 HTML 和 CSS 代码。要求 CSS 代码通过 <style> 标签内联到 HTML 中。请确保生成的代码能够准确复现图片中的布局、样式和视觉效果。"
      }
    ], null, 2)
  };

  // 加载保存的设置
  chrome.storage.sync.get(['aiServiceUrl', 'apiKey', 'modelName', 'messageTemplateType', 'customMessageTemplate', 'imageHosting', 'imgbbKey'], function(result) {
    aiServiceUrlInput.value = result.aiServiceUrl || '';
    apiKeyInput.value = result.apiKey || '';
    modelNameInput.value = result.modelName || '';
    messageTemplateTypeSelect.value = result.messageTemplateType || 'OpenAI';
    messageTemplateInput.value = result.customMessageTemplate || '';
    imageHostingSelect.value = result.imageHosting || 'none';
    imgbbApiKeyInput.value = result.imgbbKey || '';
    updateMessageTemplateVisibility();
    toggleImgbbApiKey();
  });

  // 更新消息模板可见性
  function updateMessageTemplateVisibility() {
    if (messageTemplateTypeSelect.value === 'Custom') {
      customMessageTemplateDiv.style.display = 'block';
    } else {
      customMessageTemplateDiv.style.display = 'none';
    }
  }

  // 消息模板类型选择变化时更新可见性
  messageTemplateTypeSelect.addEventListener('change', updateMessageTemplateVisibility);

  // 图床选择变化时显示/隐藏 ImgBB API Key 输入框
  imageHostingSelect.addEventListener('change', toggleImgbbApiKey);

  function toggleImgbbApiKey() {
    if (imageHostingSelect.value === 'imgbb') {
      imgbbApiKeyDiv.style.display = 'block';
    } else {
      imgbbApiKeyDiv.style.display = 'none';
    }
  }

  // 保存设置
  saveButton.addEventListener('click', function() {
    const aiServiceUrl = aiServiceUrlInput.value;
    const apiKey = apiKeyInput.value;
    const modelName = modelNameInput.value;
    const messageTemplateType = messageTemplateTypeSelect.value;
    const customMessageTemplate = messageTemplateInput.value;
    const imageHosting = imageHostingSelect.value;
    const imgbbKey = imgbbApiKeyInput.value;

    chrome.storage.sync.set({
      aiServiceUrl: aiServiceUrl,
      apiKey: apiKey,
      modelName: modelName,
      messageTemplateType: messageTemplateType,
      customMessageTemplate: customMessageTemplate,
      imageHosting: imageHosting,
      imgbbKey: imgbbKey
    }, function() {
      alert('设置已保存');
    });
  });
});
