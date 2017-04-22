define([
    "require",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dijit/layout/ContentPane",
    "dijit/layout/TabContainer",
    "dojo/text!./main.html",
    "js/Config",
    "xstyle/css!./main.css",
    "xstyle/css!//fonts.googleapis.com/css?family=Architects+Daughter"
], function (
    require,
    array,
    lang,
    domConstruct,
    ContentPane,
    TabContainer,
    main_html,
    Config
) {
return function () {
    document.title = "Koanology";
    
    var HTML_MAP = {};
    new ContentPane({content: main_html}).afterCreated(function() {
        array.forEach(this.domNode.childNodes, function(DOM) {
            HTML_MAP[DOM.className] = DOM.innerHTML;
        });
        this.destroyRecursive();
    });
    
    var CONTENT;
    return new ContentPane({"class": "viewIndex minPadding"}).afterCreated(function() {
        CONTENT = this;
        new ContentPane({"class": "topBanner minPadding", content: HTML_MAP.top}).placeAt(this);
        new TabContainer({"class": "viewArea", tabPosition: "left-h", style: "height: 100%;"}).afterCreated(function() {
            new ContentPane({
                title: "Services",
                "class": "services",
                content: HTML_MAP.services // Add dynamic/flashy content?
            }).placeAt(this);
            new ContentPane({
                title: "Wiki",
                "class": "wiki"
            }).afterCreated(function() {
                var ON_SHOW = this.on("show", function(EVENT) {
                    ON_SHOW.remove();
                    require([
                        "dojo/store/Memory",
                        "dijit/form/FilteringSelect",
                        "dijit/layout/BorderContainer"
                    ], lang.hitch(this, function(
                        Memory,
                        FilteringSelect,
                        BorderContainer
                    ) {
                        new BorderContainer().afterCreated(function() {
                            new ContentPane({
                                region: "top"
                            }).afterCreated(function() {
                                new FilteringSelect({
                                    store: new Memory({
                                        data: [
                                            {id: "./brands.html", name: "Brands"},
                                            {id: "./tricks.html", name: "Tricks"}
                                        ]
                                    }),
                                    ignoreCase: true,
                                    autoComplete: false,
                                    queryExpr: "*${0}*",
                                    highlightMatch: "all",
                                    placeHolder: "Search or select topic",
                                    onChange: function(NEW_VALUE) {
                                        CONTENT.emit("changed_selection", {bubbles: false, value: NEW_VALUE});
                                    }
                                }).placeAt(this);
                            }).placeAt(this);
                            new ContentPane({
                                region: "center"
                            }).afterCreated(function() {
                                this.own(CONTENT.on("changed_selection", lang.hitch(this, function(EVENT) {
                                    this.destroyDescendants();
                                    Config.addLoading(this.get("domNode"));
                                    require(["dojo/text!".concat(EVENT.value)], lang.hitch(this, function(HTML) {
                                        this.set({content: HTML});
                                    }));
                                })));
                            }).placeAt(this);
                        }).placeAt(this);
                        CONTENT.resize();
                    }));
                });
            }).placeAt(this);
        }).placeAt(this);
    });
};
});