
function key_delay(fn, ms) {
	let timer = 0;
	return function(...args) {
		clearTimeout(timer);
		timer = setTimeout(fn.bind(this, ...args), ms || 0);
	}
}

function sntu_init() {

	function sntu_set_version_number () {
		document.getElementById('version').textContent = chrome.runtime.getManifest().version;
	}
	sntu_set_version_number();

	let url_input_el = document.getElementById('url');
	let sync_input_el = document.getElementById('sync');
	let light_input_el = document.getElementById('light');
	let highlight_input_el = document.getElementById('highlight');
	let grant_permissions_input_el = document.getElementById('grant_permissions');
	let permissions_warning_el = document.getElementById('permission_warning');
	let sync_enabled = true;

	chrome.storage.local.get({'url': '', 'sync': true, 'light': false, 'highlight': false}, function(local_results) {
		url_input_el.value = local_results.url;
		light_input_el.checked = local_results.light;
		highlight_input_el.checked = local_results.highlight;
		sync_enabled = local_results.sync;
		sync_input_el.checked = local_results.sync;
		if(sync_enabled) {
			chrome.storage.sync.get({'url': '', 'light': false}, function(syncstorage) {
				if(syncstorage.url !== '') {
					url_input_el.value = syncstorage.url;
				}
				if(syncstorage.light !== false) {
					light_input_el.checked = local_results.light;
				}
				if(syncstorage.highlight !== false) {
					highlight_input_el.checked = local_results.highlight;
				}
			});
		}
		if(local_results.light) {
			document.body.classList.add("light");
		} else {
			document.body.classList.remove("light");
		}
	});

	function sntu_open_extension_permissions(event) {
		chrome.tabs.create({
			url: 'chrome://extensions/?id=' + chrome.runtime.id
		});
	}
	grant_permissions_input_el.addEventListener('click', sntu_open_extension_permissions);

	function sntu_filesystem_check(url, warning_el) {
		if(url.trimLeft().startsWith('file://')) {
			chrome.extension.isAllowedFileSchemeAccess(function(isAllowedAccess) {
				if (isAllowedAccess) {
					warning_el.style.display = 'none';
				} else {
					warning_el.style.display = 'block';
				}
			});
		} else {
			warning_el.style.display = 'none';
		}
	}
	sntu_filesystem_check(url_input_el.value, permissions_warning_el);

	function sntu_keyup_save_url(event) {
		chrome.storage.local.set({'url': event.target.value});
		if(sync_enabled) {
			chrome.storage.sync.set({'url': event.target.value});
		}
		sntu_filesystem_check(event.target.value, permissions_warning_el);
	}
	url_input_el.addEventListener('keyup', key_delay(sntu_keyup_save_url, 200));

	function sntu_save_sync_setting(event) {
		chrome.storage.local.set({'sync': event.target.checked });
		if(sync_input_el.checked) {
			chrome.storage.sync.set({'sync': event.target.checked });
		}
	}
	sync_input_el.addEventListener('change', sntu_save_sync_setting);

	function sntu_save_light_setting(event) {
		chrome.storage.local.set({'light': event.target.checked });
		if(sync_input_el.checked) {
			chrome.storage.sync.set({'light': event.target.checked });
		}
		if(event.target.checked) {
			document.body.classList.add("light");
		} else {
			document.body.classList.remove("light");
		}
	}
	light_input_el.addEventListener('change', sntu_save_light_setting);

	function sntu_save_highlight_setting(event) {
		chrome.storage.local.set({'highlight': event.target.checked });
		if(sync_input_el.checked) {
			chrome.storage.sync.set({'highlight': event.target.checked });
		}
	}
	highlight_input_el.addEventListener('change', sntu_save_highlight_setting);


	window.addEventListener("beforeunload", function(e){
		chrome.storage.local.set({
			'sync': sync_input_el.checked,
			'light': light_input_el.checked,
			'highlight': highlight_input_el.checked,
			'url': url_input_el.value,
		});
		if(sync_input_el.checked) {
			chrome.storage.sync.set({
				'url': url_input_el.value,
				'light': light_input_el.checked,
				'highlight': highlight_input_el.checked,
			});
		}
	}, false);

}

document.addEventListener("DOMContentLoaded", sntu_init);