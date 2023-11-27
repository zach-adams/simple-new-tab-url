function sntu_init() {
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
				if(syncedstorage.highlight) {
					return chrome.tabs.query({
						currentWindow: true,
						active: true
					}, function (tab) {
						chrome.tabs.update(tab.id, {
							url: syncedstorage.url,
							highlighted: true
						});
					});
				}
				return document.location = syncedstorage.url;
			});
		} else {
			if (localstorage.url === '') return chrome.runtime.openOptionsPage();
			if(localstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(localstorage.url, document.getElementById('permission_warning'));
			if(localstorage.highlight) {
				return chrome.tabs.query({
					currentWindow: true,
					active: true
				}, function (tab) {
					chrome.tabs.update(tab.id, {
						url: localstorage.url,
						highlighted: true
					});
				});
			}
			return document.location = localstorage.url;
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