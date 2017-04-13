(function() { // Bootstrap script that configures the page before entering standard view mode.
    window.onerror = displayError; // Register error handler before running any code.
    var HAS_ACCURATE_CLOCK = window.performance && window.performance.now;

    function currentTime() {
        return HAS_ACCURATE_CLOCK ? window.performance.now() : new Date().getTime();
    }

    function head() { // Other scripts should NOT be referencing head tag.
        return document.head || document.getElementsByTagName("head")[0];
    }

    var APP_START = currentTime(); // When client app loaded.
    var _slice = [].slice;
    var _toString = {}.toString;
    var REQUIRE_ONERROR;
    var STARTED = head().getAttribute("data-started"); // When server app deployed. Time zone issues?
    var LIB_URLS = [];
    var DOJO_CSS = (function() { // Parse Dojo location from "dojo.css" link element.
        var list = document.getElementsByTagName("link"), dom = null, i = 0;
        while(i < list.length) {
            dom = list[i];
            var DOM_HREF = dom.getAttribute("href"); // Need relative path.
            if(dom.type === "text/css" && DOM_HREF.lastIndexOf("dojo.css") !== -1) {
                dom = null;
                return DOM_HREF.split("/");
            }
            i++;
        }
        dom = null;
        throw new Error("Dojo CSS link not found.");
    })();
    var SHARED = DOJO_CSS.slice(0, 3).join("/").concat("/");
    LIB_URLS.push(SHARED);
    var APP_PATH = window.location.pathname;
    var PKG_PATH = APP_PATH + "js/lib/";
    LIB_URLS.push(PKG_PATH);
    var DOJO = DOJO_CSS.slice(0, 7).join("/").concat("/");
    var LOADING_IMG = { // Use Dojo root for image URL.
        src: "js/util/loading.gif", alt: "Loading...", width: "128", height: "128"
    };
    var BODY_TIMEOUT = currentTime() + 60*1000; // How long to wait for document body.
    var loaded = 0;
    var AFTER_ALL_LOADED = [];
    var LOADERS = [function() {
        _afterValue(document, "body", BODY_TIMEOUT, function() {
            if(document.getElementById("BASIC")) { // If basic content exists then add loading image.
                var IMG = document.body.appendChild(document.createElement("img"));
                for(var KEY in LOADING_IMG) {
                    if(LOADING_IMG.hasOwnProperty(KEY)) {
                        IMG[KEY] = LOADING_IMG[KEY];
                    }
                }
            }
            partLoaded();
        });
    // }, function() {
        // LIB_URLS.push("//www.google-analytics.com");
        // require(["//www.google-analytics.com/analytics.js"], function(analytics) {
            // console.debug("Google Analytics loaded.\nanalytics.js = ", analytics, " \nwindow.ga = ", window.ga);
            // window.ga('create', 'UA-23806328-1', 'auto');
            // partLoaded();
        // });
    }, function() {
        require(["dojo/dom-class", "dojo/hccss", ["xstyle/css!","/dijit/themes/claro/claro.css"].join(DOJO)
        ], _trap(function(domClass) {
            _afterValue(document, "body", BODY_TIMEOUT, function() {
                domClass.add(document.body, "claro loadingCursor");
                partLoaded();
            });
        }));
    }, function() {
        require(["require", "dojo/_base/lang", "dojo/has"], _trap(function(require, lang, has) {
            var QUEUE = [];
            var MAX_LAG = 100; // Largest delay in response time that is expected from browser.
            var MAX_WAIT = 1000; // Largest delay that will be added in case browser is busy.
            var SLASH_REGEX = /\//g; // Match all slashes in the string.
            var REPLACE_SLASH = "-"; // Proxy server on Dev is decoding our links before it gets to our app. (OPS-1366)
            var LOCAL_HOSTS = ["localhost", "127.0.0.1", "::1"];
            var startTime; // When request is expected to run.

            has.add("local_url", function() {
                var HOSTNAME = window.location.hostname;
                for(var i = 0; i < LOCAL_HOSTS.length; i++) {
                    if(HOSTNAME === LOCAL_HOSTS[i]) {
                        return true;
                    }
                }
            });

            function getNextRequest() {
                for(var next = QUEUE.shift(); next; next = QUEUE.shift()) {
                    if(next.widget && !next.widget._destroyed) {
                        return next;
                    }
                }
            }

            function queueNext(WAIT_TIME) {
                startTime = currentTime() + WAIT_TIME;
                setTimeout(runQueue, WAIT_TIME);
            }

            function runQueue() {
                // If browser was unable to run request around expected time then add delay to reduce rate.
                var REQUEST_LAG = currentTime() - startTime;
                var WAIT_TIME = REQUEST_LAG > MAX_LAG ? Math.min(REQUEST_LAG, MAX_WAIT) : 0;
                var request = getNextRequest();
                try {
                    while(request) {
                        request.callback.call(request.widget);
                        // Combine short requests together to increase throughput.
                        request = currentTime() - startTime > MAX_LAG ? null : getNextRequest();
                    }
                } catch(ERROR) {
                    if(request.errorHandler) {
                        request.errorHandler.call(request.widget, ERROR);
                    } else {
                        console.error(request, "\n", ERROR);
                    }
                } finally {
                    if(QUEUE.length > 0) {
                        queueNext(WAIT_TIME);
                    } else {
                        QUEUE.running = false;
                    }
                }
            }

            function _remove() { // Request will get removed when queue gets to it.
                lang.mixin(this, {
                    widget: null,
                    callback: null,
                    errorHandler: null
                });
            }

            lang.mixin(lang, {
                encodeDownloadName: function(URL_FRAGMENT) { // For encoding special characters in download links.
                    // If running locally then just encode directly.
                    return encodeURIComponent(has("local_url") ? URL_FRAGMENT : URL_FRAGMENT.replace(SLASH_REGEX, REPLACE_SLASH));
                },
                // For copying all keys just use lang.mixin instead of this method.
                copyKeys: function(FROM_OBJECT, KEYS, TO_OBJECT) {
                    for(var i = 0; i < KEYS.length; i++) {
                        var KEY = KEYS[i];
                        TO_OBJECT[KEY] = FROM_OBJECT[KEY];
                    }
                    return TO_OBJECT;
                },
                getType: _getType,
                trap: _trap,
                toArray: _toArray // The private function in lang is overkill for general use.
            });
            require(["dijit/_WidgetBase"], function(_WidgetBase) {
                lang.extend(_WidgetBase, { // Extend all widgets with convenience function(s).
                    queue: function(CALLBACK, ERROR_HANDLER) { // Adds callback to queue, which runs callbacks one at a time.
                        if(typeof CALLBACK !== "function") {
                            throw new Error("Callback is not a function: ", CALLBACK);
                        }
                        var REQUEST = {
                            widget: this,
                            callback: CALLBACK,
                            errorHandler: ERROR_HANDLER,
                            remove: _remove // For compatibility with _WidgetBase.own() API.
                        };
                        QUEUE.push(REQUEST);
                        if(!QUEUE.running) {
                            QUEUE.running = true;
                            queueNext(0);
                        } // Else callback will get called when it is its turn.
                        return REQUEST;
                    },
                    afterCreated: function(CALLBACK) { // Allows chaining a function call after widget construction.
                        CALLBACK.call(this); // Call function and bind the constructed widget (this) to it.
                        return this; // Return constructed widget for further chaining or variable assignment.
                    } // Do not trap CALLBACK since it can be nested several levels deep.
                });
                partLoaded();
            });
        }));
    }, function() {
        require(["dojo/_base/lang", "dojo/date/stamp", "js/Config"], function(lang, stamp, Config) {
            lang.mixin(Config, {
                appStart: APP_START,
                version: head().getAttribute("data-version"),
                build: head().getAttribute("data-build"),
                started: stamp.fromISOString([
                    STARTED.substring(0, 4), "-", STARTED.substring(4, 6), "-", STARTED.substring(6, 8), "T",
                    STARTED.substring(8, 10), ":", STARTED.substring(10, 12), ":", STARTED.substring(12, 14), ".",
                    STARTED.substring(14), "Z"
                ].join(""))
            });
            partLoaded();
        });
    }, function() {
        require([
            "require",
            "dojo/_base/lang",
            "dojo/ready", // Some modules are not compatible with domReady (see docs).
            "dojo/dom-construct",
            // "dojo/text!main/info", // Include this in the page load.
            "util/http_status",
            "util/Codec",
            "util/Util",
            "util/error_message",
            "js/Config"
        ], _trap(function(
            require,
            lang,
            ready,
            domConstruct,
            // info,
            http_status,
            Codec,
            Util,
            error_message,
            Config
        ) {
            var CODEC = new Codec();
            var HTTP_STATUS = http_status();

            function _update(RESPONSE) {
                var JS_INIT = CODEC.parseJson(RESPONSE);
                CODEC.transform(JS_INIT);
                var LAST_STARTED = lang.getObject("init.started", false, Config);
                var HAS_NEW_STARTED = LAST_STARTED && JS_INIT.started.getTime() !== LAST_STARTED.getTime();
                var LAST_VERSION = lang.getObject("init.version", false, Config);
                var HAS_NEW_VERSION = LAST_VERSION && JS_INIT.version !== LAST_VERSION;
                var LAST_BUILD = lang.getObject("init.build", false, Config);
                var HAS_NEW_BUILD = LAST_BUILD && JS_INIT.build !== LAST_BUILD;
                if(HAS_NEW_STARTED || HAS_NEW_VERSION || HAS_NEW_BUILD) {
                    window.location.reload(true); // Reload page without cache.
                    return true; // Tell caller that new deployment was found.
                }
                lang.mixin(Config, {
                    init: JS_INIT,
                    util: new Util(JS_INIT, CODEC)
                });
            }

            lang.mixin(Config, {
                addLoading: function(DOM_NODE) {
                    domConstruct.create("img", LOADING_IMG, DOM_NODE);
                },
                httpStatus: HTTP_STATUS,
                isLoggedIn: function() { // Returns true if user has a session.
                    // return this.init.session.name !== "anonymous";
                }//,
                // update: function(CALLBACK) {
                    // require(["dojo/request"], function(request) {
                        // request.get("main/info").then(_trap(function(RESPONSE) {
                            // if(!_update(RESPONSE)) {
                                // if(CALLBACK) {
                                    // CALLBACK();
                                // }
                            // }
                        // }), _trap(function(ERROR) {
                            // throw ERROR;
                        // }));
                    // });
                // }
            });
            // if(!_update(info)) {
                ready(_trap(function() {
                    domConstruct.empty(document.body); // Make sure rendering starts with clean slate.
                     // Add error message overlay before rendering screen.
                    error_message(HTTP_STATUS, CODEC, REQUIRE_ONERROR);
                    partLoaded(function() { // Run rendering logic after everything has setup.
                        // Require rendering logic now that error message overlay is in place.
                        // Pre-fetch imports common to all applications (that have not been imported already).
                        require(["js/main", "dojo/dom-class", "dojo/hash", "dojo/io-query", "xstyle/css!js/main.css"], function(main, domClass) {
                            domClass.remove(document.body, "loadingCursor");
                            main().placeAt(document.body).startup();
                        });
                    });
                }));
            // }
        }));
    }];
    var TOTAL = LOADERS.length;

    function displayError(MESSAGE) {
        try {
            var ARGS = _toArray(arguments);
            for(var i = 0, LENGTH = ARGS.length; i < LENGTH; i++) {
                var ARG = ARGS[i];
                if(ARG instanceof Error) {
                    var INFO = [ARG.message];
                    if(ARG.stack) {
                        INFO.push(ARG.stack);
                    }
                    ARGS[i] = {
                        toString: function() {
                            return INFO.join("\n");
                        }
                    };
                }
            }
            window.alert(ARGS.join("\n"));
        } catch(ERROR) {
            window.alert(ERROR);
        }
    }

    function _trap(CALLBACK) { // Wraps function in a try/catch block.
        return CALLBACK === "handle" ? displayError : function() {
            try {
                CALLBACK.apply(this, arguments);
            } catch(ERROR) {
                displayError(ERROR);
            }
        };
    }

    // Waits for KEY on OBJ to have non-null value before running CALLBACK. Times out on EXPIRES.
    function _afterValue(OBJ, KEY, EXPIRES, CALLBACK) {
        if(OBJ[KEY] != null) {
            CALLBACK();
            return;
        }
        if(currentTime() > EXPIRES) {
            throw new Error(['Timeout Error: Property "', KEY, '" not found on - ', OBJ].join(""));
        }
        log(function() {
            console.debug("Waiting for ", KEY, " on ", OBJ, " ...");
        });
        setTimeout(function() {
            _afterValue(OBJ, KEY, EXPIRES, CALLBACK);
        }, 0);
    }

    function log(CALLBACK) { // Imports kernel so that callback function can use console without breaking IE.
        require(["dojo/_base/kernel"], _trap(CALLBACK)); // Also ensures console window shows correct line numbers.
    } // NOTE: The CALLBACK may NOT execute immediately (if kernel is not loaded yet).

    function partLoaded(CALLBACK) {
        if(CALLBACK) {
            AFTER_ALL_LOADED.push(CALLBACK);
        }
        if(++loaded === TOTAL) {
            log(function() {
                console.debug("Loading complete: ", currentTime() - APP_START, " ms");
            });
            while(AFTER_ALL_LOADED.length > 0) {
                AFTER_ALL_LOADED.pop()();
            }
        }
    }

    function _toArray(ARGS) {
        return _slice.call(ARGS);
    }

    function _getType(OBJ) {
        return _toString.call(OBJ);
    }

    window.dojoConfig = { // Dojo configuration.
        async: true, // Everything loads a lot faster with async mode on.
        baseUrl: "/",
        packages: [ // Include project libraries.
            {name: "font-awesome", location: PKG_PATH + "font-awesome/4.7.0"},
            {name: "dgrid", location: PKG_PATH + "dgrid/1.1.0"},
            {name: "dijit", location: DOJO + "dijit"},
            {name: "dojo", location: DOJO + "dojo"},
            {name: "dojox", location: DOJO + "dojox"},
            {name: "lodash", location: PKG_PATH + "lodash/4.17.4"},
            {name: "put-selector", location: PKG_PATH + "put-selector/0.3.6"},
            {name: "xstyle", location: PKG_PATH + "xstyle/0.3.2"},
            {name: "util", location: APP_PATH + "js/util"}
        ],
        fixupUrl: function(url) { // Append timestamp if not from library.
            url += ""; // Recommended by dojo.js for some reason.
            var isFromLib = false;
            for(var i = 0; i < LIB_URLS.length; i++) {
                var LIB = LIB_URLS[i];
                isFromLib = url.slice(0, LIB.length) === LIB;
                if(isFromLib) {
                    break;
                }
            }
            return isFromLib ? url : [url, /\?/.test(url) ? "&" : "?", STARTED].join("");
        },
        deps: [], // Do not import modules until AFTER error handler is registered.
        callback: _trap(function() { // This runs after "dojo.js" loads.
            // Register error handler now that require() exists.
            REQUIRE_ONERROR = require.on("error", _trap(function(ERROR) {
                throw ERROR;
            }));
            log(function() {
                console.debug("Loading...");
            });
            while(LOADERS.length > 0) {
                LOADERS.pop()();
            }
            window.dojoConfig.deps = null;
            window.dojoConfig.callback = null;
        })
    };
})();