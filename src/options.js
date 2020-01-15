
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
	let sync_enabled = true;

	chrome.storage.local.get({'url': '', 'sync': true}, function(local_results) {
		url_input_el.value = local_results.url;
		sync_enabled = local_results.sync;
		sync_input_el.checked = local_results.sync;
		if(sync_enabled) {
			chrome.storage.sync.get({'url': ''}, function(syncstorage) {
				if(syncstorage.url !== '') {
					url_input_el.value = syncstorage.url;
				}
			});
		}
	});

	function sntu_keyup_save_url(event) {
		chrome.storage.local.set({'url': event.target.value});
		if(sync_enabled) {
			chrome.storage.sync.set({'url': event.target.value});
		}
	}
	url_input_el.addEventListener('keyup', key_delay(sntu_keyup_save_url, 200));

	function sntu_save_sync_setting(event) {
		chrome.storage.local.set({'sync': event.target.checked });
	}
	sync_input_el.addEventListener('change', key_delay(sntu_save_sync_setting, 200));


	window.addEventListener("beforeunload", function(e){
		chrome.storage.local.set({
			'sync': sync_input_el.checked,
			'url': url_input_el.value
		});
		if(sync_input_el.checked) {
			chrome.storage.sync.set({ 'url': url_input_el.value });
		}
	}, false);

}

document.addEventListener("DOMContentLoaded", sntu_init);