chrome.storage.local.get({'url': '', 'sync': true}, function(localstorage) {
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