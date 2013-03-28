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
            now = Date.now(),
            name,
            map = req.session._debounce;

        if (!fn || !fn.name) {
            throw new Error('Named function required.');
        }

        name = fn.name;

        if (!map) {
            map = req.session._debounce = {};
        }

        wait || (wait = opts.wait);

        if (!map[name] || map[name] + wait > now) {
            if (!immediate) {
                map[name] = now;

                // We need to save the session because request is already closed
                // and session middleware will not do this for us.
                req.session.save(function(err) {
                    if (err) fn(err);
                });
            }

            return setTimeout(function() {
                req.session.reload(function(err) {
                    if (err) return fn(err);
                    debounce.call(req, fn, wait, true);
                });
            }, wait);
        }

        delete map[name];
        if (!Object.keys(map).length) {
            delete req.session._debounce;
        }

        req.session.save(fn);
    }

    return function(req, res, next) {
        req.debounce = debounce;
        next();
    };
};
