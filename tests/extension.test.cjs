const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {test} = require('node:test');

function harness(script, config = {}) {
    const pending = [];
    const calls = {updates: [], local: [], sync: [], options: 0};
    const elements = new Map();
    const classes = new Set();
    const events = {};
    function element(id) {
        if (!elements.has(id)) elements.set(id, {
            value: '', checked: false, style: {}, events: {},
            addEventListener(name, callback) { this.events[name] = callback; }
        });
        return elements.get(id);
    }
    const document = {
        location: 'extension-page',
        body: {classList: {
            add(name) { classes.add(name); },
            remove(name) { classes.delete(name); },
            toggle(name, value) { value ? classes.add(name) : classes.delete(name); }
        }},
        getElementById: element,
        addEventListener(name, callback) { events[name] = callback; }
    };
    const runtime = {
        id: 'test-extension', getManifest: () => ({version: '1.2.1'}),
        openOptionsPage() { calls.options++; }
    };
    const storage = {};
    for (const area of ['local', 'sync']) storage[area] = {
        get(defaults, callback) {
            pending.push(() => callback({...defaults, ...config[area]}));
        },
        set(values) { calls[area].push(JSON.parse(JSON.stringify(values))); }
    };
    const chrome = {
        runtime, storage,
        extension: {isAllowedFileSchemeAccess(callback) {
            pending.push(() => callback(config.fileAllowed === true));
        }},
        tabs: {
            getCurrent(callback) { pending.push(() => {
                runtime.lastError = config.getError;
                callback(config.tab);
                delete runtime.lastError;
            }); },
            update(id, properties, callback) {
                assert.ok(Number.isInteger(id), 'never omit the tab ID');
                calls.updates.push({id, ...JSON.parse(JSON.stringify(properties))});
                pending.push(() => {
                    runtime.lastError = config.updateError;
                    callback();
                    delete runtime.lastError;
                });
            },
            query() { assert.fail('must not query the active tab'); },
            create() {}
        }
    };
    const context = vm.createContext({
        chrome, document,
        window: {addEventListener(name, callback) { events[name] = callback; }},
        setTimeout(callback) { callback(); return 1; }, clearTimeout() {}
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src', script), 'utf8'), context);
    events.DOMContentLoaded();
    return {
        calls, document, classes, element,
        step() { assert.ok(pending.length); pending.shift()(); },
        flush() { while (pending.length) pending.shift()(); },
        change(id, value, event = 'change') {
            const target = element(id);
            if (id === 'url') target.value = value;
            else target.checked = value;
            target.events[event]({target});
        },
        unload() { events.beforeunload(); }
    };
}

for (const sync of [false, true]) {
    function redirect(extra = {}) {
        const values = {url: 'https://example.test/new', highlight: true};
        return harness('redirect.js', {
            local: {...values, sync}, sync: values,
            tab: {id: 11, active: true}, ...extra
        });
    }
    test(`redirect targets its own active tab (sync=${sync})`, () => {
        const h = redirect(); h.flush();
        assert.deepEqual(h.calls.updates, [{id: 11, url: 'https://example.test/new', highlighted: true}]);
    });
    test(`delayed background redirect cannot replace or select another tab (sync=${sync})`, () => {
        const tab = {id: 11, active: true};
        const h = redirect({tab});
        h.step(); // Local storage completed; remaining callbacks are delayed.
        tab.active = false; // User switched to a different tab.
        h.flush();
        assert.deepEqual(h.calls.updates, [{id: 11, url: 'https://example.test/new'}]);
    });
    test(`highlight disabled navigates its own document (sync=${sync})`, () => {
        const values = {url: 'https://example.test/new', highlight: false};
        const h = redirect({local: {...values, sync}, sync: values}); h.flush();
        assert.equal(h.document.location, values.url);
        assert.deepEqual(h.calls.updates, []);
    });
    test(`empty destination opens options (sync=${sync})`, () => {
        const h = redirect({local: {url: '', sync}, sync: {url: ''}}); h.flush();
        assert.equal(h.calls.options, 1);
        assert.deepEqual(h.calls.updates, []);
    });
    for (const fileAllowed of [false, true]) test(`file permission ${fileAllowed} (sync=${sync})`, () => {
        const values = {url: 'file:///test.html', highlight: true};
        const h = redirect({local: {...values, sync}, sync: values, fileAllowed}); h.flush();
        assert.deepEqual(h.calls.updates, []);
        if (fileAllowed) assert.equal(h.document.location, values.url);
        else assert.equal(h.element('permission_warning').style.display, 'block');
    });
    for (const tab of [undefined, {}, {id: -1}, {id: '11'}]) test(`missing/invalid source tab falls back safely (sync=${sync}, tab=${JSON.stringify(tab)})`, () => {
        const h = redirect({tab}); h.flush();
        assert.equal(h.document.location, 'https://example.test/new');
        assert.deepEqual(h.calls.updates, []);
    });
    for (const error of ['getError', 'updateError']) test(`API ${error} falls back to own document (sync=${sync})`, () => {
        const h = redirect({[error]: {message: 'Tab unavailable'}}); h.flush();
        assert.equal(h.document.location, 'https://example.test/new');
    });
}

for (const syncedFlag of [false, true]) test(`options display and preserve synced booleans ${syncedFlag}`, () => {
    const h = harness('options.js', {
        local: {sync: true, url: 'https://local.test', light: !syncedFlag, highlight: !syncedFlag},
        sync: {url: 'https://synced.test', light: syncedFlag, highlight: syncedFlag}
    }); h.flush();
    assert.equal(h.element('url').value, 'https://synced.test');
    assert.equal(h.element('highlight').checked, syncedFlag);
    assert.equal(h.element('light').checked, syncedFlag);
    assert.equal(h.classes.has('light'), syncedFlag);
    h.unload();
    assert.deepEqual(h.calls.sync.at(-1), {url: 'https://synced.test', light: syncedFlag, highlight: syncedFlag});
});

test('missing synced booleans retain local preferences', () => {
    const h = harness('options.js', {local: {sync: true, light: true, highlight: true}}); h.flush();
    assert.equal(h.element('highlight').checked, true);
    assert.equal(h.element('light').checked, true);
});

test('file warning checks the asynchronously loaded synced URL', () => {
    const h = harness('options.js', {
        local: {sync: true, url: 'https://local.test'}, sync: {url: 'file:///test.html'}
    }); h.flush();
    assert.equal(h.element('permission_warning').style.display, 'block');
});

test('turning sync off stops subsequent URL edits from writing to sync', () => {
    const h = harness('options.js', {local: {sync: true}}); h.flush();
    h.change('sync', false);
    h.change('url', 'https://local-only.test', 'keyup');
    h.unload();
    assert.equal(h.calls.sync.length, 0);
    assert.equal(h.calls.local.at(-1).url, 'https://local-only.test');
});

test('turning sync on uploads displayed preferences and syncs subsequent edits', () => {
    const h = harness('options.js', {local: {sync: false, url: 'https://local.test', light: true, highlight: false}}); h.flush();
    h.change('sync', true);
    assert.deepEqual(h.calls.sync[0], {url: 'https://local.test', light: true, highlight: false});
    h.change('url', 'https://updated.test', 'keyup');
    assert.deepEqual(h.calls.sync.at(-1), {url: 'https://updated.test'});
});
