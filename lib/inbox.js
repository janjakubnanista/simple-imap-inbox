'use strict';

var util            = require('util');
var Imap            = require('imap');
var EventEmitter    = require('events').EventEmitter;
var Q               = require('q');
var Message         = require('./message');

/**
 * Helper function that asynchronously converts ImapMessage instance
 * to instance of Message class.
 * 
 * @param  {ImapMessage} imapMessage    Instance of ImapMessage class obtained from Imap server call
 * @return {Promise}                    Promise resolved with instance of Message class
 */
var convertImapMessageToMessage = function(imapMessage) {
    var deferred = Q.defer();
    var message = new Message();

    imapMessage.on('body', function(stream, info) {
        var buffer = '';

        stream.on('data', function(chunk) {
            buffer += chunk.toString('utf8');
        });

        stream.on('end', function() {
            if (info.which === 'TEXT') {
                message.body = buffer;
            } else {
                message.headers = Imap.parseHeader(buffer);
            }
        });
    });

    imapMessage.on('attributes', function(attrs) {
        message.attributes = attrs;
    });

    imapMessage.on('end', function() {
        deferred.resolve(message);
    });

    return deferred.promise;
};

var Inbox = function(options) {
    var _imap = null;
    var _this = this;
    var _inbox = null;

    Object.defineProperties(this, {
        /**
         * Underlying Imap instance.
         * It is lazy-created when first needed to enable methods like useGmail
         * change options.
         * 
         * @type {Imap}
         */
        imap: {
            enumerable: true,
            get: function() {
                if (!_imap) {
                    _imap = new Imap(options);

                    // Attach error handler that will emit error events on Inbox instance
                    _imap.on('error', function(error) {
                        _this.emit('error', error);
                    });
                }

                return _imap;
            }
        },

        /**
         * Last open inbox.
         * 
         * @type {Box}
         */
        inbox: {
            enumerable: true,
            get: function() {
                return _inbox;
            }
        }
    });

    /**
     * Apply default GMail settings.
     * This method should be called before you connect to the IMAP server,
     * otherwise it has no effect.
     * 
     * @return {Inbox} This instance
     */
    this.useGmail = function() {
        options.host = 'imap.gmail.com';
        options.port = 993;
        options.tls = true;
        options.tlsOptions = {
            rejectUnauthorized: false
        };

        return this;
    };

    /**
     * Destroy this object and Imap instance.
     * After destroyed, it can be recreated again by simply accessing it by inbox.imap
     * 
     * @return {Inbox} This instance
     */
    this.destroy = function() {
        if (_imap) {
            _imap.destroy();
            _imap = null;
            _inbox = null;
        }

        return this;
    };

    // This event is fired from connect method
    // of this object. We make inbox object accessible as a read-only
    // property by Object.defineProperty above
    this.on('connected', function(instance, inbox) {
        _inbox = inbox;
    });

    // This event is fired from disconnect method
    this.on('disconnected', function() {
        _inbox = null;
    });
};

util.inherits(Inbox, EventEmitter);

/**
 * Connects to IMAP server
 *
 * @param {Boolean} readOnly [optional] Whether to open inbox in read-only mode
 * @return {Promise} promise resolved with this inbox
 */
Inbox.prototype.connect = function(readOnly) {
    var imap = this.imap;
    var deferred = Q.defer();

    imap.once('error', deferred.reject);
    imap.once('ready', function() {
        // Open Imap inbox after the connection has been made
        // `true` as the second argument stands for read-only
        Q.ninvoke(imap, 'openBox', 'INBOX', !!readOnly)
            .then(function(box) {
                this.emit('connected', this, box);

                return this;
            }.bind(this))
            .then(deferred.resolve, deferred.reject);
    }.bind(this));

    imap.connect();

    return deferred.promise;
};

/**
 * Disconnects from IMAP server
 * Doesn't destroy Imap instance.
 * 
 * @return {Promise} promise resolved with this inbox
 */
Inbox.prototype.disconnect = function() {
    var imap = this.imap;
    var deferred = Q.defer();

    imap.once('close', function() {
        this.emit('disconnected', this);

        deferred.resolve(this);
    }.bind(this));

    this.imap.end();

    return deferred.promise;
};

/**
 * Start watching inbox for new messages
 * 
 * @return {Inbox} This instance
 */
Inbox.prototype.watch = function(options) {
    this.imap.on('mail', function(count) {
        this.fetch(count, options).then(function(messages) {
            this.emit('messages', messages, this);
        }.bind(this));
    }.bind(this));

    return this;
};

Inbox.prototype.unwatch = function() {
    this.imap.removeAllListeners('mail');

    return this;
};

Inbox.prototype.fetch = function(offset, limit, options) {
    if (arguments.length === 2) {
        options = limit;
        limit = offset;
        offset = 0;
    }

    if (arguments.length === 1) {
        limit = offset;
        offset = 0;
    }

    var source = (offset + 1) + ':' + limit;

    return this.fetchByUID(source, options);
};

Inbox.prototype.search = function(criteria, options) {
    return this.searchForUID(criteria).then(function(uids) {
        if (!uids.length) {
            return [];
        }
        
        return this.fetchByUID(uids, options);
    }.bind(this));
};

Inbox.prototype.searchForUID = function(criteria) {
    criteria = criteria || [];

    return Q.ninvoke(this.imap, 'search', criteria);
};

Inbox.prototype.fetchByUID = function(uids, options) {
    var deferred = Q.defer();
    var messagePromises = [];

    options = options || {};
    options.bodies = options.bodies || ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'];
    options.struct = true;

    var imapFetch = this.imap.fetch(uids, options);

    imapFetch.on('message', function(imapMessage) {
        messagePromises.push(convertImapMessageToMessage(imapMessage));
    }.bind(this));

    imapFetch.on('error', deferred.reject);

    imapFetch.on('end', function() {
        Q.all(messagePromises).then(deferred.resolve, deferred.reject);
    });

    return deferred.promise;
};

module.exports = Inbox;
