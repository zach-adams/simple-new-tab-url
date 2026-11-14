"""Exercise an unpacked extension with real Chromium extension APIs."""
import argparse
import asyncio
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import shutil
import tempfile
import threading

from playwright.async_api import async_playwright


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        body = b'<!doctype html><title>Extension test</title><p>Local fixture</p>'
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass


async def exercise(browser_type, source, origin, temp):
    extension = temp / 'extension'
    shutil.copytree(source, extension)
    # Keep the production script unchanged. Delay only the test page's storage
    # callback so switching tabs during a redirect is deterministic.
    (extension / 'test-delay.js').write_text('''
const originalGet = chrome.storage.local.get.bind(chrome.storage.local);
chrome.storage.local.get = function(defaults, callback) {
    originalGet(defaults, values => {
        document.documentElement.dataset.storagePending = 'true';
        window.releaseStorage = () => callback(values);
    });
};
''', encoding='utf-8')
    redirect_html = (extension / 'redirect.html').read_text(encoding='utf-8')
    (extension / 'test-delayed.html').write_text(
        redirect_html.replace('<script src="./redirect.js">',
                              '<script src="./test-delay.js"></script><script src="./redirect.js">'),
        encoding='utf-8')
    context = await browser_type.launch_persistent_context(
        str(temp / 'profile'), channel='chromium', headless=True,
        args=[f'--disable-extensions-except={extension}', f'--load-extension={extension}'])
    try:
        probe = await context.new_page()
        await probe.goto('chrome://newtab/')
        for _ in range(100):
            options = next((p for p in context.pages
                            if p.url.startswith('chrome-extension://')
                            and p.url.endswith('/options.html')), None)
            if options:
                break
            await asyncio.sleep(0.1)
        else:
            raise AssertionError('Extension did not open its options page')
        await options.wait_for_load_state()
        base = options.url.rsplit('/', 1)[0]
        target = origin + '/destination'
        work = await context.new_page()
        await work.goto(origin + '/work')

        async def settings(sync, highlight):
            await options.evaluate('''async settings => {
                await chrome.storage.local.set(settings);
                await chrome.storage.sync.set(settings);
            }''', {'sync': sync, 'highlight': highlight, 'url': target})

        # Check that Chromium actually registered the new-tab override.
        await settings(False, True)
        normal = await context.new_page()
        await normal.goto('chrome://newtab/', wait_until='commit')
        await normal.wait_for_url(target)
        await normal.close()
        print('PASS: actual new-tab override redirects to the configured URL')

        for sync in [False, True]:
            for highlight in [False, True]:
                await settings(sync, highlight)
                delayed = await context.new_page()
                await delayed.goto(base + '/test-delayed.html')
                await delayed.wait_for_function(
                    "() => document.documentElement.dataset.storagePending === 'true'")
                await work.bring_to_front()
                expected_selected = await options.evaluate('''async () => {
                    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                    return tab.id;
                }''')
                await delayed.evaluate('window.releaseStorage()')
                # Observe both pages long enough for storage and tabs callbacks.
                await asyncio.sleep(0.4)
                assert work.url == origin + '/work', (
                    f'Unrelated active tab was redirected to {work.url}')
                await delayed.wait_for_url(target, timeout=5000)
                selected = await options.evaluate('''async () => {
                    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
                    return tab.id;
                }''')
                assert selected == expected_selected, 'Background redirect stole selection'
                await delayed.close()
                print(f'PASS: delayed redirect, sync={sync}, highlight={highlight}')

        # Exercise the real options DOM and actual local/sync storage.
        await options.evaluate('''async target => {
            await chrome.storage.local.set({sync: true, url: target, light: true, highlight: true});
            await chrome.storage.sync.set({url: target, light: false, highlight: false});
        }''', target)
        # A fresh page avoids the old options page's beforeunload save replacing
        # the test settings we just seeded through the extension API.
        options = await context.new_page()
        await options.goto(base + '/options.html')
        await options.wait_for_function('''() =>
            document.getElementById('url').value !== '' &&
            document.getElementById('sync').checked &&
            !document.getElementById('highlight').checked &&
            !document.getElementById('light').checked''')
        assert not await options.locator('#highlight').is_checked()
        assert not await options.locator('#light').is_checked()
        await options.locator('#sync').uncheck()
        await options.locator('#url').fill(origin + '/local-only')
        await options.locator('#url').dispatch_event('keyup')
        await asyncio.sleep(0.3)
        saved = await options.evaluate('''async () => ({
            local: await chrome.storage.local.get(null),
            sync: await chrome.storage.sync.get(null)
        })''')
        assert saved['local']['url'] == origin + '/local-only'
        assert saved['sync']['url'] == target
        await options.locator('#sync').check()
        await options.wait_for_function('''async () =>
            (await chrome.storage.sync.get('url')).url.endsWith('/local-only')''')
        print('PASS: synced false values and disabling/re-enabling sync in options')
    finally:
        await context.close()


async def main(source):
    server = ThreadingHTTPServer(('127.0.0.1', 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    try:
        async with async_playwright() as playwright:
            with tempfile.TemporaryDirectory(prefix='sntu-browser-') as directory:
                await exercise(playwright.chromium, source,
                               f'http://127.0.0.1:{server.server_port}', Path(directory))
    finally:
        server.shutdown()
        server.server_close()
        thread.join()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1] / 'src')
    asyncio.run(main(parser.parse_args().source.resolve()))
