let originalHtml = '';

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "displayElementInfo") {
    originalHtml = request.html;
    const inlinedHtml = inlineCssToHtml(originalHtml);
    const copyButton = document.getElementById('copyButton');
    const simplifyCheckbox = document.getElementById('simplifyCheckbox');

    // 显示 HTML 内容和预览
    updateHtmlContent(inlinedHtml);

    // 添加复制功能
    copyButton.addEventListener('click', function() {
      const htmlToCopy = simplifyCheckbox.checked ? simplifyHtml(inlinedHtml) : inlinedHtml;
      copyToClipboard(htmlToCopy);
    });

    // 添加复选框事件监听
    simplifyCheckbox.addEventListener('change', function() {
      updateHtmlContent(inlinedHtml);
    });
  }
});

function updateHtmlContent(html) {
  const htmlContent = document.getElementById('htmlContent');
  const simplifyCheckbox = document.getElementById('simplifyCheckbox');
  const previewContainer = document.getElementById('previewContainer');
  
  const inlinedHtml = inlineCssToHtml(html);
  const simplifiedHtml = simplifyCheckbox.checked ? simplifyHtml(inlinedHtml) : inlinedHtml;
  
  // 更新 HTML 内容显示
  htmlContent.textContent = simplifiedHtml;
  
  // 更新预览
  previewContainer.innerHTML = '';
  const previewElement = document.createElement('div');
  previewElement.style.cssText = 'all: initial;';
  previewElement.innerHTML = simplifiedHtml;
  previewContainer.appendChild(previewElement);
}

function simplifyHtml(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  // 从根元素开始递归处理
  simplifyElement(doc.body, {});

  return doc.body.innerHTML;
}

function simplifyElement(element, parentStyles) {
  // 处理当前元素的样式
  if (element.style.cssText) {
    const simplifiedStyle = simplifyStyle(element.style.cssText, parentStyles);
    element.style.cssText = simplifiedStyle;
  }

  // 获取当前元素的计算样式
  const computedStyle = window.getComputedStyle(element);
  const currentStyles = {};
  for (let prop of computedStyle) {
    currentStyles[prop] = computedStyle.getPropertyValue(prop);
  }

  // 递归处理子元素
  for (let child of element.children) {
    simplifyElement(child, currentStyles);
  }
}

function simplifyStyle(style, parentStyles) {
  // 移除所有 !important 标记
  style = style.replace(/\s*!important/g, '');

  // 解析样式
  const styleObj = {};
  style.split(';').forEach(rule => {
    const [property, value] = rule.split(':').map(s => s.trim());
    if (property && value) {
      styleObj[property] = value;
    }
  });

  // 定义默认值
  const defaultValues = {
    'margin': '0px', 'padding': '0px', 'border': 'none',
    'font-weight': 'normal', 'font-style': 'normal',
    'text-decoration': 'none', 'color': 'black',
    'background-color': 'transparent', 'display': 'inline',
    'position': 'static', 'float': 'none', 'clear': 'none',
    'visibility': 'visible', 'opacity': '1',
    'list-style-type': 'disc', 'list-style-position': 'outside',
    'text-align': 'left', 'vertical-align': 'baseline',
    'white-space': 'normal', 'text-transform': 'none',
    'letter-spacing': 'normal', 'word-spacing': 'normal',
    'line-height': 'normal', 'text-indent': '0px',
    'box-sizing': 'content-box', 'overflow': 'visible',
    'cursor': 'auto', 'outline': 'none', 'zoom': '1',
    'max-width': 'none', 'max-height': 'none',
    'min-width': '0px', 'min-height': '0px'
  };

  const inheritableProperties = [
    'color', 'font-family', 'font-size', 'font-weight', 'font-style',
    'line-height', 'letter-spacing', 'text-align', 'text-indent',
    'text-transform', 'white-space', 'word-spacing', 'list-style-type',
    'list-style-position'
  ];

  Object.keys(styleObj).forEach(prop => {
    if (styleObj[prop] === 'auto' || 
        styleObj[prop] === 'none' || 
        styleObj[prop] === defaultValues[prop] ||
        styleObj[prop].includes('!important') ||
        (inheritableProperties.includes(prop) && styleObj[prop] === parentStyles[prop])) {
      delete styleObj[prop];
    }
  });

  // 转换回字符串
  return Object.entries(styleObj)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join('; ');
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      showMessage('复制成功！', 'success');
    }, function(err) {
      console.error('Clipboard API 复制失败: ', err);
      fallbackCopyTextToClipboard(text);
    });
  } else {
    fallbackCopyTextToClipboard(text);
  }
}

function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
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

  // 移除所有元素的 class 属性
  const allElements = doc.getElementsByTagName('*');
  Array.from(allElements).forEach(element => {
    element.removeAttribute('class');
  });

  // 返回内联后的 HTML
  return doc.body.innerHTML;
}
