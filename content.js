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

    // Set content styles
    content.style.cssText = `
        max-width: ${currentSettings.width};
        margin: 0 auto;
        padding: 20px;
        font-family: ${currentSettings.fontFamily};
        font-size: ${currentSettings.fontSize};
        line-height: ${currentSettings.lineHeight};
        color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'}; 
    `;

    // Set container background
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

    // Update heading colors
    content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        heading.style.color = currentSettings.theme === 'dark' ? '#fff' : '#333'; 
    });
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

    const content = container.querySelector('.reader-content');

    // Create a text version of the content with proper formatting
    let formattedText = ""; 
    content.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li').forEach(el => {
        // Include the heading tags in the copied text
        if (el.tagName.startsWith('H')) {
            formattedText += `<${el.tagName}>${el.textContent.trim()}</${el.tagName}>\n\n`; 
        } else {
            formattedText += `${el.textContent.trim()}\n\n`; 
        }
    });

    // Copy the formatted text to the clipboard
    navigator.clipboard.writeText(formattedText)
        .then(() => {
            // Show a success message
            const confirmation = document.createElement('div');
            confirmation.textContent = '✓ Copied!'; 
            confirmation.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: #4CAF50; // Green background
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                animation: fadeOut 2s forwards;
                z-index: 999999; // Ensure it's on top
            `;
            document.body.appendChild(confirmation);
            setTimeout(() => confirmation.remove(), 2000); // Remove after 2 seconds
        })
        .catch(err => {
            console.error("Failed to copy: ", err);
            // Optionally, show an error message to the user here
        });
}

function saveArticle() {
    const container = document.getElementById('reader-mode-container');
    if (!container) return;

    // Get content
    const title = container.querySelector('h1').textContent;
    const content = container.querySelector('.reader-content');

    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Set PDF properties
    doc.setFont('helvetica');
    doc.setFontSize(24);
    doc.text(title, 20, 20);
    doc.setFontSize(12);

    // Process content for PDF
    const elements = content.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li');
    let yPosition = 40;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    elements.forEach(element => {
        const text = element.textContent;
        const fontSize = getFontSizeForElement(element.tagName);
        doc.setFontSize(fontSize);

        // Handle text wrapping
        const splitText = doc.splitTextToSize(text, pageWidth - 2 * margin);
        
        // Check if we need a new page
        if (yPosition + (splitText.length * fontSize/2) > doc.internal.pageSize.getHeight()) {
            doc.addPage();
            yPosition = 20;
        }

        // Add text to PDF
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * fontSize/2 + 10;
    });

    // Save the PDF
    const fileName = `${title.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.pdf`;
    doc.save(fileName);

    // Show save confirmation
    const confirmation = document.createElement('div');
    confirmation.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📄</span>
            <div>
                <div style="font-weight: bold;">Article Saved as PDF!</div>
                <div style="font-size: 0.9em;">Saved as: ${fileName}</div>
            </div>
        </div>
    `;
    confirmation.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2196F3;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        animation: fadeOut 3s forwards;
        z-index: 999999;
    `;
    document.body.appendChild(confirmation);
    setTimeout(() => confirmation.remove(), 3000);
}

// Helper function for PDF font sizes
function getFontSizeForElement(tagName) {
    switch (tagName.toLowerCase()) {
        case 'h1': return 24;
        case 'h2': return 20;
        case 'h3': return 16;
        case 'h4': return 14;
        case 'h5': return 12;
        case 'h6': return 11;
        default: return 12;
    }
}
  
  function createReaderMode() {
    console.log("Creating reader mode..."); // Debug log

    try {
        // Clone the document and create a new Readability instance
        const documentClone = document.cloneNode(true);
        const reader = new Readability(documentClone);
        const article = reader.parse();

        if (!article) {
            console.log("No article content found");
            return;
        }

        // Create the main container
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

        // Create content container
        const content = document.createElement('div');
        content.className = 'reader-content';
        content.style.cssText = `
            max-width: ${currentSettings.width};
            margin: 0 auto;
            padding: 20px;
            font-family: ${currentSettings.fontFamily};
            font-size: ${currentSettings.fontSize};
            line-height: ${currentSettings.lineHeight};
            color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'};
        `;

        // Add controls at the top
        const controls = createStyleControls();
        readerContainer.appendChild(controls);

        // Process and add the content
        const cleanTitle = article.title || document.title;
        content.innerHTML = `
            <h1 style="font-size: 32px; margin-bottom: 30px; color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'};">
                ${cleanTitle}
            </h1>
            <div class="article-content">
                ${article.content}
            </div>
        `;

        // Style paragraphs and links
        const articleStyles = document.createElement('style');
        articleStyles.textContent = `
            .reader-content p {
                margin-bottom: 1.2em;
                line-height: ${currentSettings.lineHeight};
            }
            .reader-content a {
                color: ${currentSettings.theme === 'dark' ? '#66b3ff' : '#0066cc'};
                text-decoration: none;
            }
            .reader-content a:hover {
                text-decoration: underline;
            }
            .reader-content img {
                max-width: 100%;
                height: auto;
                margin: 20px 0;
                display: block;
            }
            .reader-content h2, .reader-content h3, .reader-content h4 {
                margin: 1.5em 0 0.8em;
                color: ${currentSettings.theme === 'dark' ? '#fff' : '#333'};
            }
        `;

        // Add custom styles
        readerContainer.appendChild(articleStyles);
        
        // Add the content
        readerContainer.appendChild(content);
        
        // Add to page
        document.body.appendChild(readerContainer);

        // Add keyboard shortcut to exit (Escape key)
        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                toggleReaderMode();
                document.removeEventListener('keydown', escapeHandler);
            }
        });

        // Scroll to top
        window.scrollTo(0, 0);

        console.log("Reader mode created successfully");

    } catch (error) {
        console.error("Error creating reader mode:", error);
        // Show error message to user
        const errorMessage = document.createElement('div');
        errorMessage.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4444;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 999999;
        `;
        errorMessage.textContent = "Could not create reader mode for this page";
        document.body.appendChild(errorMessage);
        setTimeout(() => errorMessage.remove(), 3000);
    }
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