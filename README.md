Simple IMAP inbox
=================

Simple IMAP inbox with watch functionality.

## API

### Inbox

`Inbox` class is the main library class

#### constructor

`new Inbox(options);`

Constructor receives one argument - object hash containing configuration options for underlying `Imap` object. See [node-imap](https://github.com/mscdex/node-imap "node-imap GitHub repo") for available configuration options.

#### <a name="inbox.connect"></a>connect

`inbox.connect();`

Connects to the IMAP server. After successful connection is made, `inbox` object emits `connected` event. This method has no arguments.

**Returns** Promise resolved with the inbox instance

#### disconnect

`inbox.disconnect();`

Disconnects from IMAP server. After connection is closed, `inbox` emits `disconnected` event. This method has no arguments.

**Returns** Promise resolved with the inbox instance

#### destroy

`inbox.destroy();`

Destroys this inbox object. The object is left in unusable state. This method has no argument.

**Returns** The inbox instance

#### useGmail

`inbox.useGmail();`

Applies GMail IMAP options to configuration options. This method has no arguments.

**Returns** The inbox instance

#### watch

`inbox.watch(options);`

`inbox.watch();`

Starts watching for new messages. `messages` event is emitted for every set of received messages.

*options* Optional options to pass to underlying fetch method. See [Inbox.fetch](#inbox.fetch) for more about `options` object.

**Returns** The inbox instance

#### unwatch

`inbox.unwatch();`

Stops watching for new messages.

**Returns** The inbox instance

#### <a name="inbox.fetch"></a>fetch

`inbox.fetch(offset, limit, options);`

`inbox.fetch(limit, options);`

`inbox.fetch(limit);`

Fetches messages from server. Returns a promise resolved with array of found messages.

*offset* Integer offset of first message to fetch
*limit* Integer number of messages to fetch
*options* Object that will be passed to underlying `Imap.fetch` method. This object is altered - `struct` attribute is set to `true` and `bodies` attribute is set to `['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT']` if not specified.

**Returns** Promise

#### search

`inbox.search(criteria, options);`

`inbox.search(criteria);`

Searches for messages on server. Returns a promise resolved with array of found messages.

*criteria* Array of valid IMAP search criteria.
*options* Object that will be passed to underlying `Imap.fetch` method. See [Inbox.fetch](#inbox.fetch) for more about `options` object.

**Returns** Promise

#### searchForUID

`inbox.searchForUID(criteria);`

Searches for message UIDs on server. Returns a promise resolved with array of found message UIDs.

*criteria* Array of valid IMAP search criteria.

**Returns** Promise

#### fetchByUID

`inbox.fetchByUID(uids, options);`

`inbox.fetchByUID(uids);`

Fetches messages from server by UIDs. Returns a promise resolved with array of found messages.

*uids* Either a string specifiing UID range (`1:10`, `1:*`), array of UID range strings or array of UIDs
*options* Object that will be passed to underlying `Imap.fetch` method. See [Inbox.fetch](#inbox.fetch) for more about `options` object.

**Returns** Promise

#### imap

`inbox.imap;`

Underlying `Imap` instance

#### inbox

`inbox.inbox;`

Instance of `Box` class from `node-imap` library. See [node-imap](https://github.com/mscdex/node-imap) for more information on this class. This property is not null after an inbox has been opened via [Inbox.connect](#inbox.connect) method.

### Message

`Message` represents single message obtained from `Inbox`.

#### headers

`message.headers;`

Object containing message headers.

#### body

`message.body;`

String containing message body in plain text.

#### subject

`message.subject;`

String subject of email message.

#### recipients

`message.recipients;`

Array of recipients. Each entry is an object containing `name` (possibly empty) and `address` properties.

#### links

`message.links;`

Array of links parsed from message body.

## Testing

To run the unit tests, you can simply run
    
    $ grunt test

You can use

    $ grunt test:live

for development purposes. This task will watch for changes in source and test files
and will run the tests once something has changed.
