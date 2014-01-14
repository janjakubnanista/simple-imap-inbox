'use strict';

var LINKS_REGEXP = /http(?:s)?:\/\/[a-zA-Z0-9/._-]+/gm;

var Message = function() {
    this.headers = {};
    this.attributes = {};
    this.body = '';
};

Object.defineProperties(Message.prototype, {
    recipients: {
        enumerable: true,
        get: function() {
            return this.headers.to || [];
        }
    },
    subject: {
        enumerable: true,
        get: function() {
            return this.headers.subject && this.headers.subject[0];
        }
    },
    links: {
        enumerable: true,
        get: function() {
            return (this.body && this.body.match(LINKS_REGEXP)) || [];
        }
    }
});

module.exports = Message;
