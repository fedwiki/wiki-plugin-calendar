# Federated Wiki - Calendar Plugin

A calendar item defines a period of time as it might apply to an event or interval in the past or future. A small language makes for concise representation of periods of varying precision. Multiple definitions are allowed and can be expressed relative to each other.

See [About Calendar Plugin](http://fed.wiki.org/about-calendar-plugin.html) for how-to documentation about this plugin.

See [About Plugins](http://plugins.fed.wiki.org/about-plugins.html) for general information about plugins.

### Development

Most of the calculation machinery can be tested in node.js at build time.

```
grunt build
```
to compile coffeescript and run non-ui tests.
```
grunt watch
````
to build on updates to plugin or tests.
