chrome.storage.local.get({'url': '', 'sync': true, 'light': false}, function(localstorage) {
    if(localstorage.light === true) {
        document.body.classList.add("light");
    }
	if(localstorage.sync === true) {
		chrome.storage.sync.get({'url':''}, function(syncedstorage) {
			if (syncedstorage.url === '') return chrome.runtime.openOptionsPage();
			return document.location = syncedstorage.url;
		});
	} else {
		if (localstorage.url === '') return chrome.runtime.openOptionsPage();
		return document.location = localstorage.url;
	}
});