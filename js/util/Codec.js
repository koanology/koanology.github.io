define([
    "dojo/request",
    "dojo/json",
    "dojo/topic",
    "dojo/_base/array",
    "dojo/_base/declare",
    "dojo/date/locale",
    "dojo/dom-construct",
    "lodash/lodash"//,
    // "./sql/Blob",
    // "./sql/Clob",
    // "./sql/NClob",
    // "./sql/ResultSet",
    // "./Binary"
], function (
    request,
    json,
    topic,
    array,
    declare,
    locale,
    domConstruct,
    _//,
    // Blob,
    // Clob,
    // NClob,
    // ResultSet,
    // Binary
) {
var ISO_8601 = "yyyy-MM-dd HH:mm:ss Z";
var NOT_DECODED = {};
return declare(null, {
    parseDate: function(DATE_STR) {
        if(DATE_STR == null) {
            return null;
        }
        
        var newDate = locale.parse(DATE_STR, {selector: "date"});
        array.some( newDate != null ? [] : [
            ISO_8601, // Most dates should be in this format.
            "yyyy-MM-dd",
            "MM/dd/yyyy"
        ], function(FORMAT){
            newDate = locale.parse(DATE_STR, {selector: "date", datePattern: FORMAT});
            return newDate; // Break out of loop if date not null.
        });
        if(newDate){
            return newDate;
        } else {
            throw new Error("Invalid date string: ".concat(DATE_STR));
        }
    },
    /**
     * Formats date into string.
     * @param DATE      Date as ISO 8601 formatted string.
     */
    formatDate: function(DATE) {
        return DATE != null ? locale.format(DATE, {selector: "date", datePattern: ISO_8601}) : null;
    },
    isLowerCase: function(STR) {
        return STR === STR.toLowerCase();
    },
    isUpperCase: function(STR) {
        return STR === STR.toUpperCase();
    },
    /**
     * Transforms parsed JSON object into native type.
     * 
     * @param RAW_VALUE   The array/object to transform.
     */
    transform: function transform(RAW_VALUE) {
        var iterator = null;
        if(_.isArray(RAW_VALUE)) {
            iterator = array.forEach;
        } else if(_.isPlainObject(RAW_VALUE)) {
            iterator = _.forOwn;
        } else {
            return; // Exit recursive call if not array/object.
        }
        iterator(RAW_VALUE, function(RAW_VAL, KEY) {
            var DECODED = this.decode(RAW_VAL);
            if(DECODED !== NOT_DECODED) { // If decoded then overwrite with decoded value.
                RAW_VALUE[KEY] = DECODED;
            }
            transform.call(this, RAW_VAL);
        }, this);
    },
    /**
     * Decodes parsed JSON object into native type.
     * 
     * @param RAW_VALUE   An object with single key specifying a predefined type.
     */
    // decode: function(RAW_VALUE) {
        // var native = NOT_DECODED;
        // if(_.isPlainObject(RAW_VALUE) && _.size(RAW_VALUE) === 1) {
            // _.forOwn(RAW_VALUE, function(RAW_VAL, KEY) {
                // switch(KEY) {
                // case "BINARY":
                    // native = new Binary(RAW_VAL);
                    // break;
                // case "BLOB":
                    // native = new Blob(RAW_VAL);
                    // break;
                // case "CLOB":
                    // var CLOB = new Clob(RAW_VAL);
                    // native = CLOB.toString();
                    // break;
                // case "NCLOB":
                    // var NCLOB = new NClob(RAW_VAL);
                    // native = NCLOB.toString();
                    // break;
                // case "DATE":
                    // native = this.parseDate(RAW_VAL);
                    // break;
                // case "TIME":
                    // native = this.parseDate(RAW_VAL);
                    // break;
                // case "TIMESTAMP":
                    // native = this.parseDate(RAW_VAL);
                    // break;
                // case "RESULT_SET":
                    // native = new ResultSet(RAW_VAL.columnNames, RAW_VAL.data);
                    // break;
                // default:
                    // console.debug("Unknown type: " + KEY);
                // }
                // return false; // Enforce exiting of loop.
            // }, this);
        // }
        // return native;
    // },
    parseJson: function(JSON) {
        return json.parse(JSON, true);
    },
    booleanToFlag: function(BOOL) {
        if(BOOL == null) {
            return null;
        }
        return BOOL ? "Y" : "N";
    }
});
});