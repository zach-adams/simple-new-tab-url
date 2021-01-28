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
	chrome.storage.local.get({'url': '', 'sync': true, 'light': false}, function(localstorage) {
	    if(localstorage.light === true) {
	        document.body.classList.add("light");
	    }
		if(localstorage.sync === true) {
			chrome.storage.sync.get({'url':''}, function(syncedstorage) {
				if (syncedstorage.url === '') return chrome.runtime.openOptionsPage();
				if(syncedstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(syncedstorage.url, document.getElementById('permission_warning'));
				return document.location = syncedstorage.url;
			});
		} else {
			if (localstorage.url === '') return chrome.runtime.openOptionsPage();
			if(syncedstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(syncedstorage.url, document.getElementById('permission_warning'));
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