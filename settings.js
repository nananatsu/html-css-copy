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
  const configSelect = document.getElementById('configSelect');
  const updateConfigButton = document.getElementById('updateConfig');
  const deleteConfigButton = document.getElementById('deleteConfig');
  const exportConfigButton = document.getElementById('exportConfig');
  const importConfigButton = document.getElementById('importConfig');
  const importInput = document.getElementById('importInput');
  const copyConfigButton = document.getElementById('copyConfig');

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

  // 加载配置列表
  loadConfigurations();

  // 加载当前选中的配置
  configSelect.addEventListener('change', handleConfigChange);

  // 更新当前配置
  updateConfigButton.addEventListener('click', updateCurrentConfiguration);

  // 删除当前配置
  deleteConfigButton.addEventListener('click', deleteCurrentConfiguration);

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

  // 图床��择变化时显示/隐藏 ImgBB API Key 输入框
  imageHostingSelect.addEventListener('change', toggleImgbbApiKey);

  function toggleImgbbApiKey() {
    if (imageHostingSelect.value === 'imgbb') {
      imgbbApiKeyDiv.style.display = 'block';
    } else {
      imgbbApiKeyDiv.style.display = 'none';
    }
  }

  function loadConfigurations() {
    chrome.storage.sync.get(['configurations', 'currentConfig'], function(result) {
      const configurations = result.configurations || {};
      const currentConfig = result.currentConfig;
      configSelect.innerHTML = '';
      for (let name in configurations) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        configSelect.appendChild(option);
      }
      // 添加"新增配置"选项
      const newConfigOption = document.createElement('option');
      newConfigOption.value = 'new';
      newConfigOption.textContent = '新增配置';
      configSelect.appendChild(newConfigOption);

      if (configSelect.options.length > 1) {
        if (currentConfig && configurations[currentConfig]) {
          configSelect.value = currentConfig;
        }
        loadSelectedConfiguration();
      } else {
        clearConfigurationFields();
      }
    });
  }

  function handleConfigChange() {
    if (configSelect.value === 'new') {
      clearConfigurationFields();
    } else {
      loadSelectedConfiguration();
    }
  }

  function loadSelectedConfiguration() {
    const selectedConfig = configSelect.value;
    chrome.storage.sync.get('configurations', function(result) {
      const configurations = result.configurations || {};
      const config = configurations[selectedConfig];
      if (config) {
        aiServiceUrlInput.value = config.aiServiceUrl || '';
        apiKeyInput.value = config.apiKey || '';
        modelNameInput.value = config.modelName || '';
        messageTemplateTypeSelect.value = config.messageTemplateType || 'OpenAI';
        messageTemplateInput.value = config.customMessageTemplate || '';
        imageHostingSelect.value = config.imageHosting || 'none';
        imgbbApiKeyInput.value = config.imgbbKey || '';
        updateMessageTemplateVisibility();
        toggleImgbbApiKey();

        // 保存当前选择的配置
        chrome.storage.sync.set({currentConfig: selectedConfig});
      }
    });
  }

  function clearConfigurationFields() {
    aiServiceUrlInput.value = '';
    apiKeyInput.value = '';
    modelNameInput.value = '';
    messageTemplateTypeSelect.value = 'OpenAI';
    messageTemplateInput.value = '';
    imageHostingSelect.value = 'none';
    imgbbApiKeyInput.value = '';
    updateMessageTemplateVisibility();
    toggleImgbbApiKey();
  }

  function updateCurrentConfiguration() {
    const currentConfig = configSelect.value;
    if (currentConfig === 'new') {
      const newConfigName = prompt('请输入新配置名称:');
      if (newConfigName && newConfigName.trim()) {
        saveConfiguration(newConfigName.trim());
      } else {
        alert('配置名称不能为空');
      }
    } else if (currentConfig) {
      saveConfiguration(currentConfig);
    } else {
      alert('请先选择一个配置或创建新配置');
    }
  }

  function saveConfiguration(configName) {
    chrome.storage.sync.get('configurations', function(result) {
      const configurations = result.configurations || {};
      configurations[configName] = getCurrentConfiguration();
      chrome.storage.sync.set({
        configurations: configurations,
        currentConfig: configName  // 保存新配置时，同时更新当前配置
      }, function() {
        alert('配置已保存');
        loadConfigurations();
      });
    });
  }

  function deleteCurrentConfiguration() {
    const currentConfig = configSelect.value;
    if (currentConfig && currentConfig !== 'new') {
      if (confirm('确定要删除当前配置吗？')) {
        chrome.storage.sync.get('configurations', function(result) {
          const configurations = result.configurations || {};
          delete configurations[currentConfig];
          chrome.storage.sync.set({configurations: configurations}, function() {
            alert('配置已删除');
            loadConfigurations();
          });
        });
      }
    } else {
      alert('请先选择一个要删除的配置');
    }
  }

  function getCurrentConfiguration() {
    return {
      aiServiceUrl: aiServiceUrlInput.value,
      apiKey: apiKeyInput.value,
      modelName: modelNameInput.value,
      messageTemplateType: messageTemplateTypeSelect.value,
      customMessageTemplate: messageTemplateInput.value,
      imageHosting: imageHostingSelect.value,
      imgbbKey: imgbbApiKeyInput.value
    };
  }

  // 复制配置
  copyConfigButton.addEventListener('click', copyCurrentConfiguration);

  function copyCurrentConfiguration() {
    const currentConfig = configSelect.value;
    if (currentConfig && currentConfig !== 'new') {
      const newConfigName = prompt('请输入新配置名称:');
      if (newConfigName && newConfigName.trim()) {
        chrome.storage.sync.get('configurations', function(result) {
          const configurations = result.configurations || {};
          if (configurations[newConfigName.trim()]) {
            alert('配置名称已存在，请选择其他名称');
          } else {
            configurations[newConfigName.trim()] = {...configurations[currentConfig]};
            chrome.storage.sync.set({configurations: configurations}, function() {
              alert('配置已复制');
              loadConfigurations();
              configSelect.value = newConfigName.trim();
              loadSelectedConfiguration();
            });
          }
        });
      } else if (newConfigName !== null) {
        alert('配置名称不能为空');
      }
    } else {
      alert('请先选择一个要复制的配置');
    }
  }

  // 导出配置
  exportConfigButton.addEventListener('click', exportConfigurations);

  // 导入配置
  importConfigButton.addEventListener('click', function() {
    importInput.click();
  });

  importInput.addEventListener('change', importConfigurations);

  function exportConfigurations() {
    chrome.storage.sync.get('configurations', function(result) {
      const configurations = result.configurations || {};
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(configurations));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "element_exporter_config.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    });
  }

  function importConfigurations(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const importedConfigurations = JSON.parse(e.target.result);
          chrome.storage.sync.get('configurations', function(result) {
            const currentConfigurations = result.configurations || {};
            const mergedConfigurations = { ...currentConfigurations, ...importedConfigurations };
            chrome.storage.sync.set({ configurations: mergedConfigurations }, function() {
              alert('配置已导入');
              loadConfigurations();
            });
          });
        } catch (error) {
          alert('导入失败：无效的配置文件');
        }
      };
      reader.readAsText(file);
    }
  }
});
