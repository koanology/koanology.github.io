define([
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dojo/text!./main.html",
    "xstyle/css!//fonts.googleapis.com/css?family=Architects+Daughter"
], function (
    array,
    lang,
    domConstruct,
    ContentPane,
    BorderContainer,
    TabContainer,
    main_html
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
    
    return new ContentPane({"class": "minPadding"}).afterCreated(function() {
        new ContentPane({"class": "topBanner minPadding", content: HTML_MAP.top}).placeAt(this);
        new TabContainer({"class": "viewArea", region: "center"}).afterCreated(function() {
            new ContentPane({
                title: "Services",
                content: HTML_MAP.highlights
            }).placeAt(this);
            new ContentPane({
                title: "Wiki"
            }).placeAt(this);
        }).placeAt(this);
    });
    
};
});