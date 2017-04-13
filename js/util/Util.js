define([
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/dom-construct",
    "lodash/lodash"//,
    // "./sql/Database"
], function (
    array,
    declare,
    domConstruct,
    _//,
    // Database
) {
return declare(null, {
    constructor: function(JS_INIT, CODEC) {
        // this.database = new Database(JS_INIT.simpleTokens, JS_INIT.typeTokens);
        this.codec = CODEC;
        this.months = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December"
        ];
    }//,
//    domToString: function(DOM_NODE) { // TODO: Verify this works correctly.
//        var CONVERTER = domConstruct.create("div");
//        domConstruct.place(DOM_NODE, CONVERTER);
//        var HTML = CONVERTER.innerHTML;
//        domConstruct.empty(CONVERTER); // Empty converter to prevent destroy() from affecting DOM_NODE.
//        domConstruct.destroy(CONVERTER);
//        return HTML;
//    },
//    isValidEmail: function(VALUE) {
//        // This regex is based off of: http://www.regular-expressions.info/email.html
//        return VALUE.match("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]{2,}\.[A-Za-z]{2,4}$");
//    },
//    insertString: function(POSITION, NEW_STRING, OLD_STRING) {
//        return [OLD_STRING.slice(0, POSITION), NEW_STRING, OLD_STRING.slice(POSITION)].join('');
//    },
    /**
     * This helps to emulate function overloading with a function map.
     * 
     * @param PARAMETERS    The list of parameters to format.
     * @return              List of parameters separated by spaces.
     */
//    formatParameters: function(PARAMETERS) {
//        var KEY = [];
//        array.forEach(PARAMETERS, function(PARAM) {
//            KEY.push(typeof PARAM);
//        });
//        return KEY.join(" ");
//    },
//    relativeCurrentPage: function() { // TODO: Make this work for all URLs.
//        var CURRENT_URL = window.location + "";
//        var LAST_SLASH = CURRENT_URL.lastIndexOf("/");
//        return CURRENT_URL.substring(LAST_SLASH + 1);
//    },
//    isCurrentPage: function(SOME_URL) { // TODO: Make this work for all URLs.
//        var CURRENT_PAGE = this.relativeCurrentPage();
//        return CURRENT_PAGE === SOME_URL;
//    },
    /**
     * Formats space separated date string into JS style date string.
     * 
     * @param DATE          Date string to parse.
     * @return              JS style date string.
     */
//    formatDate: function(DATE) {
//        var DATE_SPLIT = DATE.split(" ");
//        var NEW_DATE = [DATE_SPLIT[0], "T", DATE_SPLIT[1], DATE_SPLIT[2]].join("");
//        return NEW_DATE;
//    }
});
});