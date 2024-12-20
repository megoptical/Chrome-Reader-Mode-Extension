chrome.action.onClicked.addListener(async (tab) => {
    try {
        // Send message to content script
        chrome.tabs.sendMessage(tab.id, { action: "toggleReader" })
            .catch((err) => {
                console.log("Error occurred:", err);
                // If content script isn't loaded yet, inject it
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['Readability.js', 'content.js']
                });
            });
    } catch (error) {
        console.error("Error in background script:", error);
    }
});