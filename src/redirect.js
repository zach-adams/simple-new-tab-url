function sntu_init() {
	function sntu_redirect(url, highlight) {
		if (!highlight) return document.location = url;
		// getCurrent identifies this extension page's tab, even when another
		// tab became active while the asynchronous storage reads were pending.
		chrome.tabs.getCurrent(function(tab) {
			if (chrome.runtime.lastError || !tab || !Number.isInteger(tab.id) || tab.id < 0) {
				return document.location = url;
			}
			const update = {url: url};
			// A background/restored new tab must not change the tab selection.
			if (tab.active) update.highlighted = true;
			chrome.tabs.update(tab.id, update, function() {
				if (chrome.runtime.lastError) document.location = url;
			});
		});
	}
	function sntu_filesystem_check(url, warning_el) {
		chrome.extension.isAllowedFileSchemeAccess(function(isAllowedAccess) {
			if (isAllowedAccess) {
				return document.location = url;
			} else {
				warning_el.style.display = 'block';
			}
		});
	}
	chrome.storage.local.get({'url': '', 'sync': true, 'light': false, 'highlight': false}, function(localstorage) {
	    if(localstorage.light === true) {
	        document.body.classList.add("light");
	    }
		if(localstorage.sync === true) {
			chrome.storage.sync.get({'url':'', 'highlight': false}, function(syncedstorage) {
				if (syncedstorage.url === '') return chrome.runtime.openOptionsPage();
				if(syncedstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(syncedstorage.url, document.getElementById('permission_warning'));
				return sntu_redirect(syncedstorage.url, syncedstorage.highlight);
			});
		} else {
			if (localstorage.url === '') return chrome.runtime.openOptionsPage();
			if(localstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(localstorage.url, document.getElementById('permission_warning'));
			return sntu_redirect(localstorage.url, localstorage.highlight);
		}
	});
	let grant_permissions_input_el = document.getElementById('grant_permissions');
	function sntu_open_extension_permissions(event) {
		chrome.tabs.create({
			url: 'chrome://extensions/?id=' + chrome.runtime.id
		});
	}
	grant_permissions_input_el.addEventListener('click', sntu_open_extension_permissions);
}
document.addEventListener("DOMContentLoaded", sntu_init);
