## 0.2.1

- fixed #1 Root cause: under heavy load, debounced requests can come in faster than the session store's roundtrip time.

## 0.2.0

- Named function isn't required anymore, hash of the function is used instead
- Fix immediate param, make it public
