'use strict';

var expect = require('expect.js');
var Message = require('../lib/message');

describe('Message', function() {
    beforeEach(function() {
        this.message = new Message();
    });

    it('should have attributes and headers set to empty objects', function() {
        expect(this.message.attributes).to.eql({});
        expect(this.message.headers).to.eql({});
    });

    it('should have body set to empty string', function() {
        expect(this.message.body).to.be('');
    });

    it('should have recipients from headers.to', function() {
        this.message.headers = {
            to: [
                { address: 'jan.nanista@gooddata.com', name: 'Jan Nanista' }
            ]
        };

        expect(this.message.recipients).to.eql([
            { address: 'jan.nanista@gooddata.com', name: 'Jan Nanista' }
        ]);
    });

    it('should have subject from first element of headers.subject', function() {
        this.message.headers = {
            subject: [
                'Some subject'
            ]
        };

        expect(this.message.subject).to.be('Some subject');
    });

    it('should parse links from message body', function() {
        this.message.body = 'This is http://a.link And this one too: https://web.com This is not: not.a.link/anywhere/near';

        expect(this.message.links).to.eql([
            'http://a.link',
            'https://web.com'
        ]);
    });
});
