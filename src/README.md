# Super New Tab

> **Why does this extension exist?**
>
> Edge (and Chrome) do not allow you to customize the new tab URL for security reasons. Super New Tab provides a simple toolbar button to open your favorite home page or local file in a new tab.
>
> ☕ **Support development:** [buymeacoffee.com/davistinkers](https://buymeacoffee.com/davistinkers)
>
> **GitHub:** [github.com/davis-tinkers/Super-New-Tab](https://github.com/davis-tinkers/Super-New-Tab)

A simple Edge/Chrome browser extension that lets you open your favorite home page or local file in a new tab with a single click from the toolbar.

## Features

- Opens your configured home page URL (web or local file) in a new tab when you click the extension icon
- Simple options page to set your preferred URL
- Clean and simple interface
- Works with both local files and web URLs (with browser limitations)

## Installation

### For Testing (Developer Mode)

1. Open Edge or Chrome and navigate to `edge://extensions/` or `chrome://extensions/`
2. Enable "Developer mode" in the top right (Chrome) or bottom left (Edge)
3. Click "Load unpacked" and select the folder containing this extension
4. The extension will be installed and active

### For Distribution

1. Zip all the files in the extension folder
2. The zip file can be distributed and installed via the same method as above

## Configuration

1. Right-click the Super New Tab icon in the toolbar and select "Options" (or open from the extension details page)
2. Enter your preferred home page URL (e.g., `https://www.bing.com` or `file:///C:/path/to/your/file.html`)
3. Click "Save Settings"
4. Click the Super New Tab icon in the toolbar to open your configured URL in a new tab

## Limitations

- **Automatic redirection of the new tab page is no longer possible** due to browser security restrictions. Only user-initiated navigation (toolbar button click) is allowed.
- **Local file URLs** may not work due to browser security. If you use a local file:
  - Make sure the file path has **no spaces** (try renaming folders/files if needed)
  - Enable the extension's **"Allow access to file URLs"** permission in the browser's extension settings
- For best results, use a web page URL (e.g., `https://www.bing.com`)

## Files

- `manifest.json` - Extension configuration
- `background.js` - Handles toolbar button click to open your home page URL
- `options.html` - Options page for configuration
- `options.js` - Options page functionality
- `style.css` - Styling for the options page
- `icon*.png` - Extension icons

## Version History

- v2.0.1 - Popup/toolbar model, user-configurable home page URL, new branding as "Super New Tab"

## License

This project is based on the original "Simple New Tab URL" extension.
- link: https://github.com/zach-adams/simple-new-tab-url
