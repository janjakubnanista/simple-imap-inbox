'use strict';

var expect = require('expect.js');
var sinon = require('sinon');
var Imap = require('imap');
var Inbox = require('../lib/inbox');

describe('Inbox', function() {
    beforeEach(function() {
        var mailbox = {};

        sinon.stub(Imap.prototype, 'end', function() {
            this.emit('close');
        });

        sinon.stub(Imap.prototype, 'connect', function() {
            this.emit('ready');
        });

        sinon.stub(Imap.prototype, 'openBox', function(name, readOnly, callback) {
            callback(undefined, mailbox);
        });

        this.inbox = new Inbox();
    });

    afterEach(function() {
        Imap.prototype.end.restore();
        Imap.prototype.connect.restore();
        Imap.prototype.openBox.restore();
    });

    it('should resolve with inbox parameter when connected', function(done) {
        this.inbox.connect().then(function(inbox) {
            expect(inbox).to.be(this.inbox);
        }.bind(this)).then(done);
    });

    it('should emit `connected` event with inbox parameter when connected', function(done) {
        this.inbox.on('connected', function(inbox) {
            expect(inbox).to.be(this.inbox);

            done();
        }.bind(this));

        this.inbox.connect();
    });

    it('should resolve with inbox parameter when disconnected', function(done) {
        this.inbox.connect().then(function() {
            this.inbox.disconnect().then(function(inbox) {
                expect(inbox).to.be(this.inbox);
            }.bind(this));
        }.bind(this)).then(done);
    });

    it('should emit `disconnected` event when disconnected', function(done) {
        this.inbox.on('disconnected', function() {
            done();
        });

        this.inbox.on('connected', function() {
            this.inbox.disconnect();
        }.bind(this));

        this.inbox.connect();
    });
});
