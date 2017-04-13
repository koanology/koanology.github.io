define([
    "require",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dojo/dom-class",
    "dojo/hash",
    "dojo/io-query",
    "dijit/registry",
    "dojo/_base/array",
    "dijit/layout/ContentPane",
    "js/Config",
    "xstyle/css!font-awesome/css/font-awesome.min.css",
    "xstyle/css!dgrid/css/dgrid.css"
], function (
    require,
    lang,
    domConstruct,
    domClass,
    hash,
    ioQuery,
    registry,
    array,
    ContentPane,
    Config
) {
return function () {
    var UTIL = Config.util;
    // var CODEC = UTIL.codec;
    // var DB = UTIL.database;
    var viewCache = {};
    var options = null; // TODO: Replace this with viewCache.
    var loginRedirect = null;
    var DATA_WARNING = "Please save the data before navigating to another page. To save your data please click Cancel and then the respective Save button on the tab.";

    /*
     * Removes any keys that have falsy value (null, undefined, empty string, etc.).
     */
    function shrinkKeys(OBJECT) {
        var SHRUNK = {};
        var val = null;
        for(var KEY in OBJECT) {
            val = OBJECT[KEY];
            if(val) {
                SHRUNK[KEY] = val;
            }
        }
        return SHRUNK;
    }

    function open(QUERY) {
        if(QUERY.hasOwnProperty("mode")) { // If mode is defined then set new value.
            window.mode = QUERY.mode; // TODO: Avoid using window global object for "debug" mode.
        }
        var HASH = ioQuery.objectToQuery(QUERY);
        if(HASH !== hash()) {
            hash(HASH);
        } else {
            renderQuery(QUERY);
        }
    }
    
    function openRegister() {
        open({view: "register"});
    }

    function openDashboard() {
        open({view: "dashboard"});
    }

    function openLogin() {
        open({view: "login"});
    }

    function openProgram(EVT) {
        open({view: "program", id: EVT.id});
    }

    function openSearch(EVT) {
        open({view: "search", text: EVT.text});
    }

    function openUserManagement(EVT) {
        open({view: "user_management", id: EVT.id});
    }

    function openSubmitProposal(EVT) {
        open({view: "submit", id: EVT.id});
    }

    function openProject(EVT) {
        options = EVT;
        open({view: "project", id: EVT.id});
    }

    function replaceContent(BUILDER) {
        CONTENT.destroyDescendants();
        CONTENT.afterCreated(BUILDER);
        CONTENT.resize();
    }

    function defaultLayout(REQUIRES, FACTORY) {
        require(["dijit/layout/BorderContainer"], function(BorderContainer) {
            require(REQUIRES, function() { // Pre-load modules to reduce wait time.
                // This is imported after BorderContainer so that content can render without waiting on this.
            });
            replaceContent(function() {
                new BorderContainer().afterCreated(function() {
                    require(["./toolbar"], lang.hitch(this, function(toolbar) {
                        toolbar().afterCreated(function() {
                            this.own(this.on("toolbar_open_dashboard", openDashboard));
                            this.own(this.on("toolbar_logout", function() {
                                Config.update(openLogin);
                            }));
                            this.own(this.on("breadcrumb_clicked", openProgram));
                        }).placeAt(this);
                        new ContentPane({region: "center", "class": "view centerDivParent loadingCursor"}).afterCreated(function() {
                            new ContentPane().afterCreated(function() {
                                Config.addLoading(this.domNode);
                            }).placeAt(this);
                            require(REQUIRES, lang.hitch(this, FACTORY));
                        }).placeAt(this);
                    }));
                }).placeAt(this);
            });
        });
    }

    function withLogin(REQUIRES, FACTORY) {
        if(!Config.isLoggedIn()) {
            loginRedirect = hash();
            CONTENT.defer(openLogin);
        } else {
            defaultLayout(REQUIRES, FACTORY);
        }
    }

    function registerSearchBar() {
        this.own(this.on("search_projects", openSearch));
        this.own(this.on("open_user_management", openUserManagement));
    }

    function registerProgramRow() {
        this.own(this.on("open_program", openProgram));
    }

    function clearContent() {
        domClass.remove(this.domNode, "centerDivParent loadingCursor");
        this.destroyDescendants();
    }

    function ignoreUnsaved(EVENT) {
        CONTENT.emit("ignore_unsaved", lang.copyKeys(EVENT, ["thisArg"], {}));
    }

    function showWarning(QUERY) {
        if(this.get("isCanceling")) {
            this.set("isCanceling", false);
            return;
        }
        this.emit("show_warning", {
            parentWidget: this,
            buildMessage: function() {
                return new ContentPane().afterCreated(function() {
                    domConstruct.create("strong", {textContent: "Note: "}, this.domNode);
                    domConstruct.create("span", {
                        textContent: DATA_WARNING
                    }, this.domNode);
                    domConstruct.create("div", null, this.domNode); // Separator
                    // Deferred import of Button widget to avoid slowing down page load.
                    require(["dijit/form/Button"], lang.hitch(this, function(Button) {
                        new Button({
                            iconClass: "fa fa-lg fa-trash-o",
                            label: "Ignore",
                            onClick: function() {
                                ignoreUnsaved({});
                                this.emit("close_message");
                                renderQuery(QUERY);
                            }
                        }).placeAt(this);
                        new Button({
                            iconClass: "fa fa-lg fa-ban",
                            label: "Cancel",
                            onClick: function() {
                                CONTENT.set("isCanceling", true);
                                // Make sure hash is what is currently rendered on screen.
                                hash(CONTENT.get("renderedHash"));
                                this.emit("close_message");
                            }
                        }).placeAt(this);
                    }));
                });
            }
        });
    }

    function renderQuery(QUERY) {
        var CHANGE_MAP = {};
        CONTENT.emit("query_changes", {thisArg: this, changeMap: CHANGE_MAP});
        if(CHANGE_MAP.hasAny) {
            showWarning.call(CONTENT, QUERY);
            return;
        }
        var QUERY_HASH = ioQuery.objectToQuery(QUERY);
        CONTENT.set("renderedHash", QUERY_HASH);
        var RAW_ID = QUERY.id != null ? String(QUERY.id) : ""; // Internal logic can pass numbers here. Convert to string for consistency.
        var HAS_ID = RAW_ID != null && RAW_ID.length > 0;
        var IS_ID_NUM = HAS_ID && !isNaN(RAW_ID);
        var ID = IS_ID_NUM ? Number(RAW_ID) : null;
        switch(QUERY.view || "") {
        case "index":
            if(Config.isLoggedIn()) {
                CONTENT.defer(openDashboard);
                return;
            }
            require(["./index/main"], function(index) {
                replaceContent(function() {
                    return index().afterCreated(function() {
                    }).placeAt(this);
                });
            });
            break;
        case "test":
            require(["js/test/main"], function(test) {
                replaceContent(function() {
                    test(QUERY).placeAt(this);
                });
            });
            break;
        default:
            var NOT_FOUND_URL = "util/not_found/";
            require([NOT_FOUND_URL + "main"], function(not_found) {
                replaceContent(function() {
                    not_found(NOT_FOUND_URL).placeAt(this);
                });
            });
        }
    }

    function _destroyRecursive() {
        this.destroyRecursive();
    }

    function _remove() {
        var STORE = this.store;
        var FIELD_ID = STORE.getIdentity(this.field); // Field must have ID before being added to store.
        if(STORE.get(FIELD_ID)) { // Field can already be removed if unsaved data warning is ignored.
            STORE.remove(FIELD_ID);
        }
    }

    function isChild(FIELD) {
        var parent = FIELD.getParent();
        while(parent) { // Check if field is a child of this.
            if(parent === this) { // The value of this should be a container widget.
                return true;
            }
            parent = parent.getParent();
        }
    }

    var CONTENT;
    return new ContentPane({id: "CONTENT"}).afterCreated(function() {
        CONTENT = this;
        require(["dojo/on"], lang.hitch(this, function(on) {
            this.own(on(window, "beforeunload", lang.hitch(this, function(EVENT) {
                var CHANGE_MAP = {};
                this.emit("query_changes", {thisArg: this, changeMap: CHANGE_MAP});
                if(CHANGE_MAP.hasAny) {
                    EVENT.returnValue = DATA_WARNING;     // Gecko, Trident, Chrome 34+
                    return DATA_WARNING;              // Gecko, WebKit, Chrome <34
                }
            })));
        }));
        require(["dijit/Dialog", "dojo/aspect"], lang.hitch(this, function(Dialog, aspect) {
            this.own(this.on("show_warning", function(EVENT) {
                var PARENT = EVENT.parentWidget;
                var MESSAGE = EVENT.buildMessage.call(PARENT);
                new Dialog({
                    title: EVENT.title || "Warning",
                    content: MESSAGE,
                    onHide: _destroyRecursive
                }).afterCreated(function() {
                    var _destroy = lang.hitch(this, _destroyRecursive);
                    this.own(aspect.before(PARENT, "destroy", _destroy));
                    this.own(aspect.before(PARENT, "destroyRecursive", _destroy));
                    this.own(this.on("close_message", _destroy));
                }).show();
            }));
        }));
        // Transform events into topic for any subscribers. Only root widget(s) should broadcast events.
        require(["dojo/topic"], lang.hitch(this, function(topic) {
            this.own(this.on("field_changed", function(EVENT) {
                EVENT.stopPropagation(); // Events should NOT propogate once broadcasted.
                topic.publish("main/fieldChanged", lang.copyKeys(EVENT, ["thisArg"], {}));
            }));
            this.own(this.on("query_changes", function(EVENT) {
                EVENT.stopPropagation(); // Events should NOT propogate once broadcasted.
                topic.publish("main/queryChanges", lang.copyKeys(EVENT, [
                    "thisArg",
                    "changeMap" // Caller must add object here (with any query options). Results get mixed into this.
                ], {}));
            }));
            this.own(this.on("ignore_unsaved", function(EVENT) {
                EVENT.stopPropagation(); // Events should NOT propogate once broadcasted.
                topic.publish("main/ignoreUnsaved", lang.copyKeys(EVENT, ["thisArg"], {}));
            }));
            require(["dojo/store/Memory"], lang.hitch(this, function(Memory) { // Track any fields that changed.
                // NOTE: It is possible (though unlikely) that a field can change before this block of code runs (during page load).
                var FIELDS_STORE = new Memory({
                    data: [] // This should only list fields that are considered changed.
                });
                this.own(topic.subscribe("main/ignoreUnsaved", function(EVENT) {
                    var THIS_ARG = EVENT.thisArg;
                    if(THIS_ARG) { // If this is specified then only ignore child fields.
                        FIELDS_STORE.query(lang.hitch(THIS_ARG, isChild)).forEach(function(FIELD) {
                            _remove.call({store: FIELDS_STORE, field: FIELD});
                        });
                    } else { // Else ignore all fields.
                        FIELDS_STORE.setData([]);
                    }
                }));
                this.own(topic.subscribe("main/fieldChanged", lang.hitch(this, function(EVENT) {
                    var searchDom = EVENT.thisArg;
                    array.some([
                        "domNode", // For widgets
                        "element.$" // CKEditor
                    ], function(KEY) {
                        var DOM = lang.getObject(KEY, false, searchDom);
                        if(DOM) {
                            searchDom = DOM;
                            return true;
                        }
                    });
                    var FIELD = registry.getEnclosingWidget(searchDom);
                    var FIELD_ID = FIELD ? FIELDS_STORE.getIdentity(FIELD) : null;
                    if(FIELD_ID == null) {
                        console.warn("Missing field ID: ", FIELD);
                    } else if(!FIELDS_STORE.get(FIELD_ID)) {
                        FIELDS_STORE.add(FIELD);
                        FIELD.own({store: FIELDS_STORE, field: FIELD, remove: _remove}); // Auto-remove widget on destruction.
                    } // TODO: Remove fields from store if they are changed to original value.
                })));
                this.own(topic.subscribe("main/queryChanges", lang.hitch(this, function(EVENT) {
                    var FIELDS = FIELDS_STORE.data;
                    lang.mixin(EVENT.changeMap, { // The change map must be set by the caller.
                        hasAny: FIELDS.length > 0,
                        thisHasAny: array.some(FIELDS, isChild, EVENT.thisArg) // TODO: Make sure this works with placeAt(DOM).
                    });
                })));
            }));
            this.own(topic.subscribe("/dojo/hashchange", function(HASH) {
                if(HASH) {
                    renderQuery(ioQuery.queryToObject(HASH));
                } else {
                    open({view: Config.isLoggedIn() ? "dashboard" : "login"});
                }
            }));
            open(hash() ? ioQuery.queryToObject(hash()) : { // If hash exists then go there directly.
                // view: Config.isLoggedIn() ? "dashboard" : "login" // Else route based on log in status.
                view: "index" // Else route based on log in status.
            });
            // Now that view is showing prevent server from killing session of active user.
            // require(["dojo/throttle", "dojo/request"], lang.hitch(this, function(throttle, request) {
                // var _keepAlive = throttle(function() {
                    // request.get("main/keepalive");
                // }, 5*60*1000);
                // array.forEach(["mousemove", "input", "change"], function(EVENT_NAME) {
                    // this.own(this.on(EVENT_NAME, _keepAlive));
                // }, this);
            // }));
        }));
    });
};
});