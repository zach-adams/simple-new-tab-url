function log(msg) {
    const logEl = document.getElementById('log');
    if (logEl) logEl.textContent += msg + '\n';
    console.log(msg);
}

log('Redirect script loaded');

const goBtn = document.getElementById('go');
if (goBtn) {
    goBtn.addEventListener('click', function() {
        log('Go button clicked');
        try {
            log('Attempting redirect to https://zombo.com/');
            window.location.replace('https://zombo.com/');
            log('Redirect attempted');
        } catch (e) {
            log('Redirect failed: ' + e);
        }
    });
} else {
    log('Go button not found');
}