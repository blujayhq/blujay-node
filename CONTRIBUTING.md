# Contributing

Most of this library is generated from the Blujay API definition, so a change to the files in `src/` (other than `src/custom/`) would be overwritten by the next release. If something is wrong or missing, please [open an issue](https://github.com/blujayhq/blujay-node/issues) and we'll fix it at the source. Fixes to the README and examples are welcome as pull requests.

## Working on the library

```sh
npm ci
npm run build        # ESM and CommonJS builds in dist/
npm test             # webhook verification tests
npm run check:docs   # type-checks every README sample and example
./smoke/run.sh       # installs the packed library and runs the quickstart against a local mock
```
