console.log("Content script loaded");

var selectedElement = null;
var highlightElement = null;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log("Content script received message:", request);
  if (request.action === "selectElement") {
    console.log("Select element action received");
    document.body.style.cursor = 'crosshair';
    document.addEventListener('mouseover', highlightElementHandler);
    document.addEventListener('click', selectElementHandler, true);
  } else if (request.action === "exportElement") {
    if (selectedElement) {
      exportHTML();
    } else {
      alert("请先选择一个元素");
    }
  }
});

function highlightElementHandler(e) {
  console.log("Highlighting element:", e.target);
  if (highlightElement) {
    highlightElement.parentNode.removeChild(highlightElement);
  }
  
  var rect = e.target.getBoundingClientRect();
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
    highlightElement.parentNode.removeChild(highlightElement);
    highlightElement = null;
  }

  // 直接导出 HTML
  exportHTML();
}

function exportHTML() {
  if (selectedElement) {
    var inlinedHtml = inlineStyles(selectedElement);
    chrome.runtime.sendMessage({
      action: "showElementInfo",
      html: inlinedHtml
    });
  }
}

function inlineStyles(element) {
  var container = document.createElement('div');
  
  function processElement(el, parent) {
    var clone = el.cloneNode(false);
    var styles = window.getComputedStyle(el);
    var inlineStyle = '';
    
    // 处理所有样式
    for (var i = 0; i < styles.length; i++) {
      var prop = styles[i];
      var value = styles.getPropertyValue(prop);
      if (value && !isCompatibilityStyle(prop)) {
        inlineStyle += prop + ': ' + value + '; ';
      }
    }

    // 特别处理定位和布局相关的属性
    var layoutProps = [
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

    for (var j = 0; j < layoutProps.length; j++) {
      var prop = layoutProps[j];
      var value = styles.getPropertyValue(prop);
      if (value) {
        inlineStyle += prop + ': ' + value + ' !important; ';
      }
    }

    // 特别处理伪元素
    inlineStyle += processPseudoElement(el, '::before');
    inlineStyle += processPseudoElement(el, '::after');

    // 特别处理背景
    var backgroundStyle = getBackgroundStyle(el);
    if (backgroundStyle) {
      inlineStyle += backgroundStyle;
    }

    clone.style.cssText = inlineStyle;
    clone.removeAttribute('class');
    
    parent.appendChild(clone);
    
    // 处理所有子节点，包括文本节点
    for (var k = 0; k < el.childNodes.length; k++) {
      var child = el.childNodes[k];
      if (child.nodeType === Node.TEXT_NODE) {
        clone.appendChild(document.createTextNode(child.textContent));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        processElement(child, clone);
      }
    }
  }
  
  processElement(element, container);
  return container.innerHTML;
}

function processPseudoElement(el, pseudo) {
  var styles = window.getComputedStyle(el, pseudo);
  var pseudoStyle = '';
  
  if (styles.content !== 'none' && styles.content !== '') {
    pseudoStyle += 'content: ' + styles.content + '; ';
    for (var i = 0; i < styles.length; i++) {
      var prop = styles[i];
      var value = styles.getPropertyValue(prop);
      if (value && !isCompatibilityStyle(prop)) {
        pseudoStyle += prop + ': ' + value + '; ';
      }
    }
    return pseudo + ' { ' + pseudoStyle + ' } ';
  }
  return '';
}

function getBackgroundStyle(element) {
  var currentElement = element;
  var backgroundStyle = '';
  var backgroundProps = ['background', 'background-color', 'background-image', 'background-position', 'background-repeat', 'background-size'];

  while (currentElement && currentElement !== document.body) {
    var styles = window.getComputedStyle(currentElement);
    var hasBackground = false;

    for (var i = 0; i < backgroundProps.length; i++) {
      var prop = backgroundProps[i];
      var value = styles.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'initial' && value !== 'inherit' && value !== 'transparent') {
        backgroundStyle += prop + ': ' + value + ' !important; ';
        hasBackground = true;
      }
    }

    if (hasBackground) {
      break;
    }

    currentElement = currentElement.parentElement;
  }

  return backgroundStyle;
}

function isCompatibilityStyle(prop) {
  var compatibilityPrefixes = ['-webkit-', '-moz-', '-ms-', '-o-'];
  for (var i = 0; i < compatibilityPrefixes.length; i++) {
    if (prop.indexOf(compatibilityPrefixes[i]) === 0) {
      return true;
    }
  }
  return prop.indexOf('webkit') !== -1 || 
         prop.indexOf('moz') !== -1 || 
         prop.indexOf('ms') !== -1 || 
         prop.indexOf('o') !== -1;
}
