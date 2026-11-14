// Adds https:// when the URL has no scheme, so "google.com" opens the website
// instead of being read as a file path inside the extension.
function sntu_normalize_url(url) {
	url = url.trim();
	if (url === '') return url;
	// Already has a scheme (https:, http:, file:, chrome:, about:...).
	// A digit after the colon is a port ("localhost:3000"), not a scheme.
	if (/^[a-z][a-z0-9+.-]*:(?!\d)/i.test(url)) return url;
	return 'https://' + url;
}
