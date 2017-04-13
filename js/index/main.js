define([
    "dojo/_base/lang",
    "dojo/dom-construct",
    "dijit/layout/ContentPane",
    "dijit/layout/BorderContainer",
    "dijit/layout/TabContainer",
    "dojo/text!./main.html",
    "xstyle/css!//fonts.googleapis.com/css?family=Architects+Daughter"
], function (
    lang,
    domConstruct,
    ContentPane,
    BorderContainer,
    TabContainer,
    main_html
) {
return function () {
    document.title = "Koanology";
    
    return new BorderContainer().afterCreated(function() {
        new ContentPane({"class": "topBanner minPadding", region: "top", content: main_html}).placeAt(this);
        new TabContainer({"class": "viewArea", region: "center"}).afterCreated(function() {
            new ContentPane({
                title: "Highlights"
            }).placeAt(this);
            new ContentPane({
                title: "Wiki"
            }).placeAt(this);
            new ContentPane({
                title: "Contact"
            }).placeAt(this);
        }).placeAt(this);
    });
    
};
});