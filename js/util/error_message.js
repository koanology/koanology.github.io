define([
    "require",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dijit/_WidgetBase",
    "dijit/layout/ContentPane",
    "dijit/Dialog"
], function (
    require,
    lang,
    domConstruct,
    domClass,
    _WidgetBase,
    ContentPane,
    Dialog
) {
return function (HTTP_STATUS, CODEC, REQUIRE_ONERROR) {
    var HTTP_CODES = HTTP_STATUS.codes;
    var HTTP_LABELS = HTTP_STATUS.labels;

    function getError(ARGS) {
        for(var i = 0, LENGTH = ARGS.length; i < LENGTH; i++) {
            var ARG = ARGS[i];
            if(ARG == null) {
                continue; // Skip it and keep looking for error.
            } else if (ARG instanceof Error) {
                return ARG;
            } else if(ARG.error instanceof Error) { // Direct lookup in case property is not enumberable.
                return ARG.error;
            } else {
                for(var KEY in ARG) { // Check other properties for error.
                    if(ARG[KEY] instanceof Error) {
                        return ARG[KEY];
                    }
                }
            }
        }
    }

    function _catch(ERROR, LOG_IT) {
        if(LOG_IT) {
            console.error(ERROR);
        }
        displayError(ERROR);
    }

    function errorEvent() {
        console.error.apply(console, arguments); // Log all error event arguments to console.
        var ERROR = getError(arguments);
        if(ERROR) {
            _catch(ERROR);
        } else {
            displayError.apply(this, arguments);
        }
    }

    function _trap(CALLBACK) {
        return CALLBACK === "handle" ? errorEvent : function() {
            try {
                return CALLBACK.apply(this, arguments);
            } catch(ERROR) {
                _catch(ERROR, true);
            }
        };
    }

    function displayError(MESSAGE) {
        try {
            var showMessage = true;

            var ARGS = arguments;
            var LENGTH = ARGS.length;
            var ERROR = getError(ARGS) || MESSAGE;
            if(!ERROR) {
                new ContentPane().afterCreated(function() {
                    domConstruct.create("span", {textContent: "Error information missing."}, this.domNode);
                }).placeAt(CONTENT);
                return;
            }
            var RESPONSE = ERROR.response;
            if (RESPONSE) {
                var DATA = (function(RAW_DATA) {
                    try { // If string then try to parse as JSON.
                        return CODEC.parseJson(RAW_DATA);
                    } catch(ERR) { // Else just return it.
                        return RAW_DATA;
                    }
                }(RESPONSE.data));
                var HANDLER = lang.getType(DATA) === "[object String]" ? handleString : handleObject;
                HANDLER(DATA, RESPONSE.url, RESPONSE.status).placeAt(CONTENT);
            } else if (ERROR.domNode && ERROR.placeAt && ERROR.isInstanceOf && ERROR.isInstanceOf(_WidgetBase)) {
                // If widget then render directly.
                domClass.add(ERROR.domNode, "internalError");
                ERROR.placeAt(CONTENT);
            } else if(window.mode === "debug") { // Render all arguments if in debug mode.
                new ContentPane({"class": "internalError text"}).afterCreated(function() {
                    for(var i = 0; i < LENGTH; i++) {
                        var ARG = ARGS[i];
                        if(ARG instanceof Error) {
                            lang.hitch(domConstruct.create("div", {"class": "arg" + i}, this.domNode), function() {
                                domConstruct.create("div", {"class": "message",textContent: ARG.message}, this);
                                if(ARG.stack) {
                                    domConstruct.create("div", {"class": "stack",textContent: ARG.stack}, this);
                                }
                            })();
                        } else {
                            domConstruct.create("div", {"class": "arg" + i, textContent: ARG + ""}, this.domNode);
                        }
                    }
                }).placeAt(CONTENT);
            } else {
                showMessage = false;
            }

            if(showMessage) {
                CONTENT.set("title", ["Error (", CODEC.formatDate(new Date()), ")"].join(""));
                CONTENT.show();
            }
        } catch(ERR) {
            console.error(ERR);
            window.alert(ERR);
        }
    }

    function handleString(DATA, URL_STR, STATUS) { // If string assume data is HTML.
        switch(STATUS) {
        case HTTP_CODES.UNAUTHORIZED:
            return new ContentPane({
                "class": "strError text"
            }).afterCreated(function() {
                domConstruct.create("span", {textContent: "UNAUTHORIZED ", "class": "exception"}, this.domNode);
                domConstruct.create("span", {textContent: "Please "}, this.domNode);
                require(["dojo/on"], lang.hitch(domConstruct.create("a", {
                    href: ".",
                    textContent: "log in"
                }, this.domNode), function(on) {
                    var ONCLICK = on(this, "click", function(EVT) {
                        EVT.preventDefault();
                        window.location.reload();
                        ONCLICK.remove();
                    });
                }));
                domConstruct.create("span", {textContent: " to continue."}, this.domNode);
            });
        case HTTP_CODES.FORBIDDEN:
            return new ContentPane({
                "class": "strError text"
            }).afterCreated(function() {
                domConstruct.create("span", {textContent: "FORBIDDEN ", "class": "exception"}, this.domNode);
                domConstruct.create("span", {textContent: "Request was rejected: "}, this.domNode);
                domConstruct.create("a", {href: URL_STR, textContent: URL_STR}, this.domNode);
            });
        default:
            return new ContentPane({
                "class": "defaultStrError text"
            }).afterCreated(function() {
                var LABEL = HTTP_LABELS[STATUS];
                domConstruct.create("span", {
                    textContent: LABEL ? LABEL + " " : STATUS + " ERROR ",
                    "class": "exception"
                }, this.domNode);
                domConstruct.create("span", {textContent: "Request string error: "}, this.domNode);
                domConstruct.create("a", {href: URL_STR, textContent: URL_STR}, this.domNode);
            });
        }
    }

    function handleObject(DATA, URL_STR, STATUS) {
        var EXCEPTION = DATA.exception;
        var CAUSE = DATA.cause;
        if(!EXCEPTION) {
            return new ContentPane({"class": "defaultObjError text"}).afterCreated(function() {
                var LABEL = HTTP_LABELS[STATUS];
                domConstruct.create("span", {
                    textContent: LABEL ? LABEL + " " : STATUS + " ERROR ",
                    "class": "exception"
                }, this.domNode);
                domConstruct.create("span", {textContent: "Request object error: "}, this.domNode);
                domConstruct.create("a", {href: URL_STR, textContent: URL_STR}, this.domNode);
            });
        }
        switch(EXCEPTION) {
        case "DB_ERROR":
            return new ContentPane({"class": "sqlException text"}).afterCreated(function() {
                domConstruct.create("div", {textContent: CAUSE}, this.domNode);
            });
        default:
            return new ContentPane({"class": "objError text"}).afterCreated(function() {
                domConstruct.create("span", {textContent: EXCEPTION + ": ", "class": "exception"}, this.domNode);
                domConstruct.create("span", {textContent: CAUSE, "class": "cause"}, this.domNode);
            });
        }
    }

    var CONTENT;
    new Dialog({
        title: "Error",
        id: "ERROR_MESSAGE",
        onHide: function() {
            this.destroyDescendants();
        }
    }).afterCreated(function() {
        CONTENT = this;
        window.onerror = displayError; // Display directly since these errors automatically log to console.
        require.on("error", _trap("handle"));
        REQUIRE_ONERROR.remove();
        require(["dojo/topic"], lang.hitch(this, function(topic) {
            this.own(topic.subscribe("dgrid-error", _trap("handle")));
        }));
        lang.mixin(lang, {
            trap: _trap
        });
    });
    return CONTENT;
};
});