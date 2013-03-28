QUnit.module('debounce');

function getReq() {
    var req = {session: {}};

    req.session.reload = req.session.save = function(cb) {
        cb();
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
    }, 'Named function required.');

    throws(function() {
        req.debounce(function() {});
    }, 'Named function required.');
});

test('debounce once', function() {
    var middleware = debounce(),
        req = getReq(),
        dcounter = 0,
        scounter = 0,
        rcounter = 0;

    expect(3);
    stop();

    middleware(req, null, noop);

    req.session.save = function(cb) {
        scounter++;
        cb();
    };

    req.session.reload = function(cb) {
        rcounter++;
        cb();
    };

    req.debounce(function a() {
        dcounter++;
    });

    setTimeout(function() {
        equal(dcounter, 1, 'debounced function called only once');
        equal(scounter, 2, 'session saved amount');
        equal(rcounter, 1, 'session reload amount');
        start();
    }, 1000);
});

test('debounce multiple', function() {
    var middleware = debounce(),
        req = getReq(),
        counter = 0;

    expect(1);
    stop();

    middleware(req, null, noop);

    req.debounce(function a() {
        counter++;
    }, 2000);

    setTimeout(function() {
        req.debounce(function a() {
            counter++;
        }, 2000);
    }, 500);

    setTimeout(function() {
        req.debounce(function a() {
            counter++;
        }, 2000);
    }, 1000);

    setTimeout(function() {
        equal(counter, 1, 'debounced function called only once');
        start();
    }, 3000);
});
