var i2c = require('i2c');
var address = 0x20;
var wire = new i2c(address, {device: '/dev/i2c-1'});

wire.scan(function(err, data) {
    console.log(JSON.stringify(data));
  // result contains an array of addresses
});