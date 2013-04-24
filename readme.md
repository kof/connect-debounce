## Distributed debounced function execution ala underscore on per session basis as connect middleware.


### Why
If user interaction is followed by a request to the server and has heavy task to do, you might want to prevent the user from triggering this multiple times. It is not always possible to solve this on the client, because:

1. User can reload the page directly after the action, so request never happens.
2. User can switch to another page which has to display something depending on previous changes.
3. Blocking the screen is not a good option from the UI side of view, also it will not prevent user from page reload.

### How

Module will save the date of the last attempt to execute the function into the session store of connect. On every attempt to execute it again, it will check the date and prevent execution more often than the `wait` time defined for the function.

### Setup

Debounce returns a middlware function. You can pass new `wait` option, default is 1000ms.

Example:

    var debounce = require('connect-debounce');
    var app = connect();

    app
        .use(debounce({wait: 3000}))
        .use(connect.logger('dev'))
        .use(connect.static('public'))
        .use(function(req, res){
            res.end('hello world\n');
        })
        .listen(3000);

### req.debounce(fn:Function, [wait:Number], [immediate:Boolean])

- `fn` is a function which execution will be debounced. It can get an error object passed as first argument. Don't ignore it! Better to use a function name to avoid potential conflicts with some other debounced function which has the same implementation.
- `wait` time in ms to wait, default is the value described in setup.
- `immediate` exec function immediately and debounce it later

Example:

    app.get('/', function(req, res, next) {
        req.debounce(function(err) {
            if (err) {

                // Request is already responded, log the error.
                return log(err);
            }

            doSomething();
        }, 3000);

        res.send('my response');
    });

### Install

    npm i connect-debounce

### Running tests

    npm test

