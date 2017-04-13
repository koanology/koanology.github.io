define([
    "lodash/lodash"
], function (
    _
) {
return function() {
    var HTTP_CODES = {
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        PAYMENT_REQUIRED: 402,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        METHOD_NOT_ALLOWED: 405,
        NOT_ACCEPTABLE: 406,
        PROXY_AUTHENTICATION_REQUIRED: 407,
        REQUEST_TIMEOUT: 408,
        CONFLICT: 409,
        GONE: 410,
        LENGTH_REQUIRED: 411,
        PRECONDITION_FAILED: 412,
        REQUEST_ENTITY_TOO_LARGE: 413,
        REQUEST_URI_TOO_LONG: 414,
        UNSUPPORTED_MEDIA_TYPE: 415,
        REQUESTED_RANGE_NOT_SATISFIABLE: 416,
        EXPECTATION_FAILED: 417,
        INTERNAL_SERVER_ERROR: 500,
        NOT_IMPLEMENTED: 501,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
        HTTP_VERSION_NOT_SUPPORTED: 505
    };
    var HTTP_LABELS = {
        BAD_REQUEST: "Bad Request",
        UNAUTHORIZED: "Unauthorized",
        PAYMENT_REQUIRED: "Payment Required",
        FORBIDDEN: "Forbidden",
        NOT_FOUND: "Not Found",
        METHOD_NOT_ALLOWED: "Method Not Allowed",
        NOT_ACCEPTABLE: "Not Acceptable",
        PROXY_AUTHENTICATION_REQUIRED: "Pay Authentication Required",
        REQUEST_TIMEOUT: "Request Timeout",
        CONFLICT: "Conflict",
        GONE: "Gone",
        LENGTH_REQUIRED: "Length Required",
        PRECONDITION_FAILED: "Precondition Failed",
        REQUEST_ENTITY_TOO_LARGE: "Request Entity Too Large",
        REQUEST_URI_TOO_LONG: "Request URI Too Long",
        UNSUPPORTED_MEDIA_TYPE: "Unsupported Media Type",
        REQUESTED_RANGE_NOT_SATISFIABLE: "Requested Range Not Satisfiable",
        EXPECTATION_FAILED: "Expecation Failed",
        INTERNAL_SERVER_ERROR: "Internal Server Error",
        NOT_IMPLEMENTED: "Not Implemented",
        BAD_GATEWAY: "Bad Gateway",
        SERVICE_UNAVAILABLE: "Service Unavailable",
        GATEWAY_TIMEOUT: "Gateway Timeout",
        HTTP_VERSION_NOT_SUPPORTED: "HTTP Version Not Supported"
    };
    var CODE_LABELS = {}; // Map each code to label.
    _.forOwn(HTTP_CODES, function(VAL, KEY) { // VAL = HTTP Code (Number)
        CODE_LABELS[VAL] = HTTP_LABELS[KEY];
    });
    
    return {
        codes: HTTP_CODES,
        labels: CODE_LABELS
    };
};
});