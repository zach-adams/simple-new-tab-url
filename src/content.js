// Content script to inject into new tab page
(function() {
    // Wait for the page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', executeScript);
    } else {
        executeScript();
    }

    function executeScript() {
        // Try to find and click the home button
        const homeButton = document.querySelector('[aria-label="Home"], [title="Home"], .home-button, #home-button');
        
        if (homeButton) {
            homeButton.click();
        } else {
            // If we can't find the home button, try to navigate to the home page
            window.location.href = 'chrome://newtab/';
        }
    }
})();
