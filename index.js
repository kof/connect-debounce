var createHash = require('crypto').createHash;

/**
 * Debounce a function execution similar to underscore, but in
 * distributed per session fashion.
 *
 * Options:
 *   - `wait` - time in ms to wait until to execute the function, default 1000ms
 *
 * @param {Object} opts
 * @return {Function}
 */
module.exports = function(opts) {
    opts || (opts = {});
    opts.wait || (opts.wait = 1000);

    function debounce(fn, wait, immediate) {
        var req = this,
            map, id;

        if (!fn) {
            throw new Error('Function required.');
        }

        if (wait === true) {
            wait = null;
            immediate = true;
        }

        map = req.session._debounce || (req.session._debounce = {});
        id = fn._hash || (fn._hash = createHash('md5').update(fn.toString()).digest('hex'));
        wait || (wait = opts.wait);
        map[id] || (map[id] = immediate ? 0 : Date.now());

        // Try to run it later, need to wait.
        if (map[id] + wait > Date.now()) {
            setTimeout(function() {
                req.session.reload(function(err) {
                    if (err) return fn(err);

                    map = req.session._debounce;

                    if (!map || !map[id]) {
                        return;
                    }

                    if (map[id] + wait < Date.now()) {
                        debounce.call(req, fn, wait, true);
                    }
                });
            }, wait + 10);

        // Run it immediately.
        } else {
            fn();

            // Cleanup it delayed for the case it will be called again.
            setTimeout(function() {
                req.session.reload(function(err) {
                    if (err) return fn(err);

                    map = req.session._debounce;

                    // Already cleaned up or a new timeout was defined.
                    if (!map || !map[id] || map[id] + wait > Date.now()) {
                        return;
                    }

                    delete map[id];
                    if (!Object.keys(map).length) {
                        delete req.session._debounce;
                    }

                    // We need to save the session because request is possibly
                    // already closed and session middleware will not do this for us.
                    req.session.save(function(err) {
                        if (err) fn(err);
                    });
                });
            }, wait + 10);
        }

        map[id] = Date.now();

        req.session.save(function(err) {
            if (err) fn(err);
        });

        return id;
    }

    return function(req, res, next) {
        req.debounce = debounce;
        next();
    };
};
