// Super New Tab: Open the configured home page URL in a new tab when the toolbar button is clicked
chrome.action.onClicked.addListener(function(tab) {
    chrome.storage.sync.get(['homepageUrl'], function(result) {
        const url = result.homepageUrl || 'https://zombo.com/';
        chrome.tabs.create({ url: url });
    });
});
