console.log("Content script loaded!");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);
    if (request.action === "toggleReader") {
        console.log("Toggling reader mode...");
        toggleReaderMode();
        sendResponse({ status: "success" }); 
    }
    return true;
});
  let readerModeActive = false; 
  
  // Settings management
  const defaultSettings = {
    fontSize: '20px',
    lineHeight: '1.8',
    fontFamily: 'Georgia, serif',
    theme: 'light',
    width: '800px',
    saved: []
  };
  
  let currentSettings = { ...defaultSettings };
  
  // Load settings from storage
  chrome.storage.local.get('readerSettings', (result) => {
    if (result.readerSettings) {
      currentSettings = { ...defaultSettings, ...result.readerSettings };
    }
  });
  
  function saveSettings() {
    chrome.storage.local.set({ 'readerSettings': currentSettings });
  }
  
  function createStyleControls() {
    const controls = document.createElement('div');
    controls.className = 'reader-controls';
    controls.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      display: flex;
      gap: 10px;
      z-index: 999999;
      background: ${currentSettings.theme === 'dark' ? '#333' : '#fff'};
      padding: 10px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    `;
  
    // Font size controls
    const fontSizeControl = document.createElement('select');
    fontSizeControl.innerHTML = `
      <option value="16px">Small</option>
      <option value="20px">Medium</option>
      <option value="24px">Large</option>
    `;
    fontSizeControl.value = currentSettings.fontSize;
    fontSizeControl.onchange = (e) => {
      currentSettings.fontSize = e.target.value;
      updateStyles();
      saveSettings();
    };
  
    // Font family control
    const fontFamilyControl = document.createElement('select');
    fontFamilyControl.innerHTML = `
      <option value="Georgia, serif">Georgia</option>
      <option value="Arial, sans-serif">Arial</option>
      <option value="'Times New Roman', serif">Times New Roman</option>
    `;
    fontFamilyControl.value = currentSettings.fontFamily;
    fontFamilyControl.onchange = (e) => {
      currentSettings.fontFamily = e.target.value;
      updateStyles();
      saveSettings();
    };
  
    // Width control
    const widthControl = document.createElement('select');
    widthControl.innerHTML = `
      <option value="600px">Narrow</option>
      <option value="800px">Medium</option>
      <option value="1000px">Wide</option>
    `;
    widthControl.value = currentSettings.width;
    widthControl.onchange = (e) => {
      currentSettings.width = e.target.value;
      updateStyles();
      saveSettings();
    };
  
    // Theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.textContent = currentSettings.theme === 'dark' ? '☀️' : '🌙';
    themeToggle.onclick = toggleTheme;
  
    // Save article button
    const saveButton = document.createElement('button');
    saveButton.textContent = '💾 Save';
    saveButton.onclick = saveArticle;
  
    // Copy button
    const copyButton = document.createElement('button');
    copyButton.textContent = '📋 Copy';
    copyButton.onclick = copyArticle;
  
    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '✕';
    closeButton.onclick = toggleReaderMode;
  
    // Style all buttons and controls
    [fontSizeControl, fontFamilyControl, widthControl, themeToggle, saveButton, copyButton, closeButton].forEach(el => {
      el.style.cssText = `
        padding: 8px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        background: ${currentSettings.theme === 'dark' ? '#444' : '#eee'};
        color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'};
      `;
    });
  
    controls.append(
      fontSizeControl,
      fontFamilyControl,
      widthControl,
      themeToggle,
      saveButton,
      copyButton,
      closeButton
    );
  
    return controls;
  }
  
  function updateStyles() {
    const container = document.getElementById('reader-mode-container');
    if (!container) return;
  
    const content = container.querySelector('.reader-content');
    if (!content) return;
  
    content.style.cssText = `
      max-width: ${currentSettings.width};
      margin: 0 auto;
      padding: 20px;
      font-family: ${currentSettings.fontFamily};
      font-size: ${currentSettings.fontSize};
      line-height: ${currentSettings.lineHeight};
      color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'};
    `;
  
    container.style.background = currentSettings.theme === 'dark' ? '#222' : '#fff';
  
    // Update controls background
    const controls = container.querySelector('.reader-controls');
    if (controls) {
      controls.style.background = currentSettings.theme === 'dark' ? '#333' : '#fff';
      controls.querySelectorAll('button, select').forEach(el => {
        el.style.background = currentSettings.theme === 'dark' ? '#444' : '#eee';
        el.style.color = currentSettings.theme === 'dark' ? '#fff' : '#333';
      });
    }
  }
  
  function toggleTheme() {
    currentSettings.theme = currentSettings.theme === 'dark' ? 'light' : 'dark';
    updateStyles(); 
    saveSettings();
  }
  
  function saveArticle() {
    const container = document.getElementById('reader-mode-container');
    if (!container) return;
  
    const title = container.querySelector('h1').textContent;
    const content = container.querySelector('.reader-content').innerHTML;
    const url = window.location.href;
    const date = new Date().toISOString();
  
    const article = { title, content, url, date };
    currentSettings.saved = [...(currentSettings.saved || []), article];
    saveSettings();
  
    // Show saved confirmation
    const confirmation = document.createElement('div');
    confirmation.textContent = '✓ Article Saved';
    confirmation.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      animation: fadeOut 2s forwards;
    `;
    document.body.appendChild(confirmation);
    setTimeout(() => confirmation.remove(), 2000);
  }
  
  function copyArticle() {
    const container = document.getElementById('reader-mode-container');
    if (!container) return;
  
    const title = container.querySelector('h1').textContent;
    const content = container.querySelector('.reader-content').textContent; 
    const text = `${title}\n\n${content}`;
  
    navigator.clipboard.writeText(text).then(() => {
      // Show copy confirmation
      const confirmation = document.createElement('div');
      confirmation.textContent = '✓ Copied to clipboard';
      confirmation.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        animation: fadeOut 2s forwards;
      `;
      document.body.appendChild(confirmation);
      setTimeout(() => confirmation.remove(), 2000);
    });
  }
  
  function cleanText(text) {
    return text.replace(/\s+/g, ' ').trim();
  }
  
  function extractArticleContent() {
    // Use Readability library for content extraction
    const readability = new Readability(document.cloneNode(true));
    let articleContent;
    try {
      articleContent = readability.parse();
    } catch (error) {
      console.error("Readability parsing error:", error);
      return null;
    }
  
    if (articleContent) {
      const contentDiv = document.createElement('div');
      contentDiv.innerHTML = articleContent.content;
      return contentDiv;
    } else {
      return null; 
    }
  }
  
  function createReaderMode() {
    const articleContent = extractArticleContent();
    if (!articleContent) return;
  
    const readerContainer = document.createElement('div');
    readerContainer.id = 'reader-mode-container';
    readerContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${currentSettings.theme === 'dark' ? '#222' : '#fff'}; 
      padding: 20px;
      box-sizing: border-box;
      overflow-y: auto;
      z-index: 999999;
    `;
  
    const content = document.createElement('div');
    content.className = 'reader-content';
  
    // Add controls
    const controls = createStyleControls();
    readerContainer.appendChild(controls);
  
    // Process content
    const title = document.querySelector('h1') || document.title; 
    const cleanedTitle = cleanText(title.textContent || title);
  
    content.innerHTML = `
      <h1 style="font-size: 32px; margin-bottom: 30px;">${cleanedTitle}</h1>
      ${processArticleContent(articleContent)}
    `;
  
    readerContainer.appendChild(content);
    document.body.appendChild(readerContainer);
  
    // Apply current styles
    updateStyles();
  }
  
  function processArticleContent(articleContent) {
    let cleanContent = '';
    const paragraphs = articleContent.getElementsByTagName('p');
  
    for (let p of paragraphs) {
      if (p.textContent.length > 20) {
        cleanContent += `<p>${cleanText(p.textContent)}</p>`;
      }
    }
  
    return cleanContent;
  }
  
  function toggleReaderMode() {
    const container = document.getElementById('reader-mode-container');
    if (container) {
      container.remove();
      readerModeActive = false;
    } else {
      createReaderMode();
      readerModeActive = true;
    }
  }