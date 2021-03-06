'use strict';

const debug = require('debug')('marimo'),
    Base = require('./base');

let parentOf = function (item) {
        return item && item.__parent && item.__parent.__parent || undefined;
    };

class Newman {
    constructor(emitter, etc, options) {
        var currentGroup = options.collection;
        this.tests = _getTestCount(options);
        Base.call(this, emitter);

        emitter.on('start', () => {
            let msg = `Tests beginning. Count = ${this.tests}`;
            this.count = 1;
            if (process.send) process.send(msg);
            debug(msg);
        });

        emitter.on('beforeItem', (err, o) => {
        });

        // print out the request name to be executed and start a spinner
        emitter.on('beforeRequest', (err, o) => {
        });

        // output the response code, reason and time
        emitter.on('request', (err, o) => {
        });

        // realtime print out script errors
        emitter.on('script', (err, o) => {
        });

        emitter.on('assertion', (err, o) => {
            // print each test assertions
            let msg = '';
            if (err) {
                msg = `✗ Test failed! [${this.count} /  ${this.tests}]: "${o.assertion}" (error: ${err.message})`;
            }
            else {
                msg = `✔ Test Passed! [${this.count} / ${this.tests}] "${o.assertion}" (duration ${emitter.test.duration}) ms"`;
            }

            if (process.send) process.send(msg);
            debug(msg);

            this.count++;
        });

        emitter.on('done', () => {
            let msg = `Tests done: ${JSON.stringify(emitter.stats)}`;
            if (process.send) process.send(msg);
            debug(msg); 
        });
    }
}

// Quite hacky function to determine the # of assertions in a postman collection.
// Will live with this and test closely until find a better awy
function _getTestCount(options) {
    let tests = 0;
    options.collection.items.members.forEach((postmanItem) => {
        tests += _getTestCountRecurse(postmanItem);
    });
    return tests;    
}

function _getTestCountRecurse(postmanItem) {
    let tests = 0;
    if (postmanItem.items) {
        postmanItem.items.members.forEach((item) => {
            tests += _getTestCountRecurse(item);
        });
    }
    else {
        tests += _getTestCountSingle(postmanItem)
    }
    return tests;
}

function _getTestCountSingle(postmanItem) {
    let tests = 0;
    if (postmanItem.events) { 
        postmanItem.events.members.forEach((member) => {                    
            if (member.listen == 'test') {
                if (member.script) {
                    member.script.exec.forEach((script) => {
                        if (script.search(/tests\[('|").+('|")\]/) > -1) {
                            tests++;
                        }
                    });
                }
            }    
        });
    }    
    return tests;
}

module.exports = Newman;