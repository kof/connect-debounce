QUnit.module('debounce');

function getReq(reloadTimeout, saveTimeout) {
    var req = {session: {}};

    req.session.reload = function(cb) {
        setTimeout(cb, reloadTimeout);
    };

    req.session.save = function(cb) {
        setTimeout(cb, saveTimeout);
    };

    return req;
}

function noop() {}

test('setup', function() {
    var opts = {};
    equal(typeof debounce, 'function', 'debounce defined');
    equal(typeof debounce(), 'function', 'returned function');
    debounce(opts);
    equal(opts.wait, 1000, 'default wait');
    opts.wait = 2000;
    debounce(opts);
    equal(opts.wait, 2000, 'setup wait');
});

test('middleware function', function() {
    var middleware = debounce(),
        req = getReq();

    middleware(req, null, function() {
        ok(true, 'next called');
    });

    equal(typeof req.debounce, 'function', 'debounce attached to request');
});

test('debounce arguments validation', function() {
    var middleware = debounce(),
        req = getReq();

    middleware(req, null, noop);

    throws(function() {
        req.debounce();
    }, 'Function required.');
});

test('debounce once', function() {
    var middleware = debounce(),
        req = getReq(),
        dcounter = 0,
        scounter = 0,
        rcounter = 0,
        id;

    expect(8);
    stop();

    middleware(req, null, noop);

    req.session.save = function(cb) {
        scounter++;
        cb();
    };

    req.session.reload = function(cb) {
        rcounter++;
        equal(typeof req.session._debounce, 'object', 'debounce store attached');
        equal(typeof req.session._debounce[id], 'number', 'timestamp attached');
        cb();
    };
    id = req.debounce(function() {
        dcounter++;
    });

    setTimeout(function() {
        equal(dcounter, 1, 'debounced function called only once');
        equal(scounter, 3, 'session saved amount');
        equal(rcounter, 2, 'session reload amount');
        equal(req.session._debounce, null, 'debounce map removed from session');
        start();
    }, 2050);
});


test('debounce with immediate=true', function() {
    var middleware = debounce(),
        req = getReq(),
        dcounter = 0,
        scounter = 0,
        rcounter = 0,
        id;

    expect(7);
    stop();

    middleware(req, null, noop);

    req.session.save = function(cb) {
        scounter++;
        cb();
    };

    req.session.reload = function(cb) {
        rcounter++;
        equal(typeof req.session._debounce, 'object', 'debounce store attached');
        equal(typeof req.session._debounce[id], 'number', 'timestamp attached');
        cb();
    };

    id = req.debounce(function() {
        dcounter++;
    }, true);

    equal(dcounter, 1, 'debounced function called immediately');

    setTimeout(function() {
        equal(dcounter, 1, 'debounced function called only once');
        equal(scounter, 2, 'session saved amount');
        equal(rcounter, 1, 'session reload amount');
        equal(req.session._debounce, null, 'debounce map removed from session');
        start();
    }, 1020);
});

test('debounce multiple times', function() {
    var middleware = debounce(),
        req = getReq(),
        counter = 0;

    expect(1);
    stop();

    middleware(req, null, noop);

    function fn() {
        counter++;
    }

    req.debounce(fn, 2000);

    setTimeout(function() {
        req.debounce(fn, 2000);
    }, 1000);

    setTimeout(function() {
        req.debounce(fn, 2000);
    }, 2000);

    setTimeout(function() {
        equal(counter, 1, 'debounced function called once');
        start();
    }, 5000);
});

test('debounce multiple times with immediate=true', function() {
    var middleware = debounce(),
        req = getReq(),
        counter = 0;

    expect(1);
    stop();

    middleware(req, null, noop);

    function fn() {
        counter++;
    }

    req.debounce(fn, 2000, true);

    setTimeout(function() {
        req.debounce(fn, 2000, true);
    }, 1000);

    setTimeout(function() {
        req.debounce(fn, 2000, true);
    }, 2000);

    setTimeout(function() {
        equal(counter, 2, 'debounced function called only once');
        start();
    }, 5000);
});

test('double call with immediate=true, second call faster than session store roundtrip', function() {
    var middleware = debounce(),
        reloadTimeout = 500,
        req = getReq(reloadTimeout, 0),
        counter = 0;

    expect(1);
    stop();

    middleware(req, null, noop);

    function fn() {
        counter++;
    }

    req.debounce(fn, 500, true);

    setTimeout(function () {
        req.debounce(fn, 500, true);
    }, reloadTimeout / 2);

    setTimeout(function() {
        equal(counter, 1, 'debounced function called only once');
        start();
    }, 5000);
});
