# Simple New Tab URL

The unpacked browser extension is in `src/`. Load that directory using
**Load unpacked** on your browser's extensions page in developer mode.

## Regression tests

Run the dependency-free JavaScript tests with Node.js 18 or newer:

```sh
node --test tests/extension.test.cjs
```

For the real browser smoke tests, install Python's `playwright` package and its
Chromium browser, then run:

```sh
python -m pip install playwright
python -m playwright install chromium
python tests/browser_smoke.py
```

The smoke tests load the extension into a temporary Chromium profile. They use
local HTTP pages and synthetic extension settings; they never use your normal
browser profile. A test-only script delays storage callbacks to reproduce a
new-tab redirect running after another tab has become active. Temporary profiles
and extension copies are removed on exit.

Playwright's bundled Chromium is used because branded Chrome and Edge no longer
support the command-line extension sideloading flags used by this test.
