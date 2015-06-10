var parseData = require('../lib/adapters/parseData');
var expect = require('chai').expect;

describe('Parse data from GPS request', function() {
    var data;
    before(function() {
        data = parseData('(123456789102BR00140607A3332.5862S07037.2134W073.3232411144.5600000000L0001B3CC)');
    });

    it('returns proper parsed object', function() {
        expect(data.start).to.be.equals('(');
        expect(data.deviceId).to.be.equals('123456789102');
        expect(data.command).to.be.equals('BR00');
        expect(data.data).to.be.equals('140607A3332.5862S07037.2134W073.3232411144.5600000000L0001B3CC');
        expect(data.finish).to.be.equals(')');
        expect(data.action).to.equals('ping');
    });
});
