// Super New Tab - Options page functionality
document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('homepage-url');
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');

    // Load saved URL
    chrome.storage.sync.get(['homepageUrl'], function(result) {
        if (result.homepageUrl) {
            urlInput.value = result.homepageUrl;
        } else {
            // Default to Zombo if no URL is set
            urlInput.value = 'https://zombo.com/';
        }
    });

    // Save settings
    saveButton.addEventListener('click', function() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showStatus('Please enter a valid URL', 'error');
            return;
        }

        // Validate URL
        try {
            new URL(url);
        } catch (e) {
            showStatus('Please enter a valid URL', 'error');
            return;
        }

        chrome.storage.sync.set({
            homepageUrl: url
        }, function() {
            showStatus('Settings saved successfully!', 'success');
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});
