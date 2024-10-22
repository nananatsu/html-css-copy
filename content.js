let selectedElement = null;
let highlightElement = null;
let isSelecting = false;
let startX, startY;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Content script received message:", request);
  if (request.action === "selectElement") {
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', highlightElementHandler);
    document.addEventListener('click', selectElementHandler, true);
  } else if (request.action === "exportElement") {
    if (selectedElement) {
      exportHTML();
    } else {
      alert("请先选择一个元素");
    }
  } else if (request.action === "smartGenerate") {
    createOverlay();
  }
});

function highlightElementHandler(e) {
  if (highlightElement) {
    highlightElement.remove();
  }
  
  const rect = e.target.getBoundingClientRect();
  highlightElement = document.createElement('div');
  highlightElement.style.position = 'fixed';
  highlightElement.style.zIndex = '10000';
  highlightElement.style.left = rect.left + 'px';
  highlightElement.style.top = rect.top + 'px';
  highlightElement.style.width = rect.width + 'px';
  highlightElement.style.height = rect.height + 'px';
  highlightElement.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
  highlightElement.style.pointerEvents = 'none';
  document.body.appendChild(highlightElement);
}

function selectElementHandler(e) {
  e.preventDefault();
  e.stopPropagation();
  document.body.style.cursor = 'default';
  document.removeEventListener('mouseover', highlightElementHandler);
  document.removeEventListener('click', selectElementHandler, true);
  
  selectedElement = e.target;

  if (highlightElement) {
    highlightElement.remove();
    highlightElement = null;
  }

  // 直接导出 HTML
  exportHTML();
}

function exportHTML() {
  if (selectedElement) {
    const inlinedHtml = inlineStyles(selectedElement);
    chrome.runtime.sendMessage({
      action: "showElementInfo",
      html: inlinedHtml
    });
  }
}

function inlineStyles(element) {
  const container = document.createElement('div');
  
  function processElement(el, parent) {
    const clone = el.cloneNode(false);
    const styles = window.getComputedStyle(el);
    let inlineStyle = '';
    
    // 处理所有样式
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      const value = styles.getPropertyValue(prop);
      if (value && !isCompatibilityStyle(prop)) {
        inlineStyle += `${prop}: ${value}; `;
      }
    }

    // 特别处理定位和布局相关的属性
    const layoutProps = [
      'position', 'top', 'right', 'bottom', 'left', 'z-index',
      'display', 'flex', 'flex-direction', 'flex-wrap', 'flex-flow', 'justify-content', 'align-items', 'align-content',
      'float', 'clear',
      'width', 'height', 'max-width', 'max-height', 'min-width', 'min-height',
      'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
      'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
      'border', 'border-width', 'border-style', 'border-color',
      'box-sizing',
      'overflow', 'overflow-x', 'overflow-y'
    ];

    layoutProps.forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (value) {
        inlineStyle += `${prop}: ${value} !important; `;
      }
    });

    // 特别处理伪元素
    inlineStyle += processPseudoElement(el, '::before');
    inlineStyle += processPseudoElement(el, '::after');

    // 特别处理背景
    const backgroundStyle = getBackgroundStyle(el);
    if (backgroundStyle) {
      inlineStyle += backgroundStyle;
    }

    clone.style.cssText = inlineStyle;
    clone.removeAttribute('class');
    
    parent.appendChild(clone);
    
    // 处理所有子节点，包括文本节点
    el.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        clone.appendChild(document.createTextNode(child.textContent));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        processElement(child, clone);
      }
    });
  }
  
  processElement(element, container);
  return container.innerHTML;
}

function processPseudoElement(el, pseudo) {
  const styles = window.getComputedStyle(el, pseudo);
  let pseudoStyle = '';
  
  if (styles.content !== 'none' && styles.content !== '') {
    pseudoStyle += `content: ${styles.content}; `;
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      const value = styles.getPropertyValue(prop);
      if (value && !isCompatibilityStyle(prop)) {
        pseudoStyle += `${prop}: ${value}; `;
      }
    }
    return `${pseudo} { ${pseudoStyle} } `;
  }
  return '';
}

function getBackgroundStyle(element) {
  let currentElement = element;
  let backgroundStyle = '';
  const backgroundProps = ['background', 'background-color', 'background-image', 'background-position', 'background-repeat', 'background-size'];

  while (currentElement && currentElement !== document.body) {
    const styles = window.getComputedStyle(currentElement);
    let hasBackground = false;

    backgroundProps.forEach(prop => {
      const value = styles.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'initial' && value !== 'inherit' && value !== 'transparent') {
        backgroundStyle += `${prop}: ${value} !important; `;
        hasBackground = true;
      }
    });

    if (hasBackground) {
      break;
    }

    currentElement = currentElement.parentElement;
  }

  return backgroundStyle;
}

function isCompatibilityStyle(prop) {
  const compatibilityPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
  return compatibilityPrefixes.some(prefix => prop.startsWith(prefix)) || 
         prop.includes('webkit') || 
         prop.includes('moz') || 
         prop.includes('ms') || 
         prop.includes('o');
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: transparent;
    z-index: 10000;
    cursor: crosshair;
  `;
  document.body.appendChild(overlay);

  const selectionBox = document.createElement('div');
  selectionBox.style.cssText = `
    position: fixed;
    border: 2px solid #fff;
    background-color: rgba(0, 0, 0, 0.1);
    display: none;
    z-index: 10001;
  `;
  document.body.appendChild(selectionBox);

  overlay.addEventListener('mousedown', startSelection);
  overlay.addEventListener('mousemove', updateSelection);
  overlay.addEventListener('mouseup', endSelection);

  function startSelection(e) {
    isSelecting = true;
    startX = e.clientX;
    startY = e.clientY;
    selectionBox.style.left = startX + 'px';
    selectionBox.style.top = startY + 'px';
    selectionBox.style.display = 'block';
  }

  function updateSelection(e) {
    if (!isSelecting) return;
    const currentX = e.clientX;
    const currentY = e.clientY;
    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    selectionBox.style.width = width + 'px';
    selectionBox.style.height = height + 'px';
    selectionBox.style.left = (currentX > startX ? startX : currentX) + 'px';
    selectionBox.style.top = (currentY > startY ? startY : currentY) + 'px';
  }

  function endSelection(e) {
    if (!isSelecting) return;
    isSelecting = false;
    const endX = e.clientX;
    const endY = e.clientY;
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);

    captureSelectedArea(left, top, width, height);

    overlay.remove();
    selectionBox.remove();
  }
}

function captureSelectedArea(left, top, width, height) {
  const data = {
    action: "captureScreenshot",
    area: { x: left, y: top, width, height },
    format: 'jpeg'  // 添加这一行，指定格式为 JPEG
  };
  chrome.runtime.sendMessage(data);
}

function sendImageToAI(imageDataUrl) {
  // 这里应该实现发送图片到 AI 服务的逻辑
  // 由于涉及到外部 API 调用，我们需要在 background.js 中实现这个功能
  chrome.runtime.sendMessage({
    action: "sendImageToAI",
    imageDataUrl: imageDataUrl
  });
}
