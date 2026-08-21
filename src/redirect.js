function sntu_init() {
	function sntu_highlight_redirect(url) {
		// Target THIS page's own tab. The previous code passed the array returned
		// by chrome.tabs.query() straight into chrome.tabs.update(), so `tab.id`
		// was undefined and the update fell through to its default target -- the
		// active tab of the current window. When the new tab page loads in a
		// background tab, that is an unrelated tab the user is currently reading,
		// which then gets navigated away.
		return chrome.tabs.getCurrent(function (own) {
			if (!own) {
				// No tab context (shouldn't happen for an extension page); fall back
				// to a self-navigation, which can only ever affect this page.
				document.location = url;
				return;
			}
			if (!own.active) {
				// This new tab page is in a background tab -- something opened it
				// without focusing it (browser automation, a middle click, a link
				// opened in the background). Highlighting would drag the user over
				// to a tab they did not choose to look at, so navigate in place.
				document.location = url;
				return;
			}
			chrome.tabs.update(own.id, {
				url: url,
				highlighted: true
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
				if(syncedstorage.highlight) {
					return sntu_highlight_redirect(syncedstorage.url);
				}
				return document.location = syncedstorage.url;
			});
		} else {
			if (localstorage.url === '') return chrome.runtime.openOptionsPage();
			if(localstorage.url.trimLeft().startsWith('file://')) return sntu_filesystem_check(localstorage.url, document.getElementById('permission_warning'));
			if(localstorage.highlight) {
				return sntu_highlight_redirect(localstorage.url);
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