# Whitebeam

Opinionated configuration for the Winston logger with added
Express middleware for tracking a request across event loop
jumps.

So, this achieves something similar to [thread-local storage](https://en.wikipedia.org/wiki/Thread-local_storage).

> Note: there is an issue with [http.ClientRequest](https://nodejs.org/docs/latest-v12.x/api/http.html#http_class_http_clientrequest)
> and domains present in NodeJS starting with version 12.3 and
> fixed in version 12.14.1 (see [here](https://github.com/nodejs/node/issues/30122)),
> so using this package with any of those versions of NodeJS will
> cause crashes.

⚠️️ **IMPORTANT!** ⚠️️ because of some Winston limitation (or this
author's inability to figure out how to use it correctly), in
order to be able to log `Error` objects, they have to be provided
as the **first** parameter of the logger function e.g.:

```
// this will be logged reliably
logger.error(new Error('so bad'));
```

or as the **second** parameter e.g.

```
// this will also work now fine
logger.error('error occurred because reasons', new Error('so bad'));
```

This has to do with the `message` and `stack` properties of the
`Error` prototype not being enumerable and therefore not copied
when using `Object.assign` 😔

Also keep in mind that the `Error.message` property will be exposed
by the logger as the `err_message` property in case the second style
is being used (to not clash with the default `message` property).

# Motivation

Since NodeJS runs on a single-threaded event loop, in order
to track the log entries emitted in regards to a specific
HTTP requests, we need to 'hang on' to the event loop. Two
ways of doing this are via the [`domain`](https://nodejs.org/dist/latest-v8.x/docs/api/domain.html) and
[`async_hooks`](https://nodejs.org/dist/latest-v8.x/docs/api/async_hooks.html) modules.

For example, this is extremely helpful in case an external
service call is made across an `async` boundary and some logging
relevant to the HTTP request that initialted the `async` call
is made. Using a common request-unique ID, logs for a specific
request can be grouped together.

There are also helper modules already written that implement
what is called _continuation-local storage_ (like [this one](https://github.com/othiym23/node-continuation-local-storage)).

This module is a light-weight implementation of the general
continuation-local storage concept, but aimed at just solving
the logging problem (the other module does a lot of other
things). It uses the `domain` NodeJS base module, as `async_hooks`
does not currenly have good support in utility libraries such
as Bluebird.

Furthermore, specific configuration for the [winston](https://www.npmjs.com/package/winston) module
is provided in order to log the request-identifying data.

In order to log the request ID even among service boundaries,
(for example, in the NGINX logs) the `response` decorator middleware
also adds several headers that uniquely indentify the request.

## Logger

The `logger` object exposes a configured Winston instance
that can be used either as is, or as a factory for named
loggers.

By default, only a `Console` logger is configured.

If `NODE_ENV=development`, the default format is human-readable
and colorized. Otherwise, a JSON output is generated.

## Middleware

The `domainHook` middleware is used to bind the `request`
and `response` pipeline objects to an active `domain` that
will handle continued logging across event loop jumps.

The `responseDecorator` middleware is used to decorate the
`response` object, its headers and the active `domain` object
(if available) with `request`-specific information:

 * `pvid`: page-view ID, which is a MD5 hash of the current
 request's user ID, requester IP and URL or referer (if XHR)
 * `ruid`: request-unique ID, a Base64-enoded version 1 UUID
 * `uid`: user ID for the request
 * `path`: the Express `request` object's `path` property
 * `pid`: the value of `process.pid`
