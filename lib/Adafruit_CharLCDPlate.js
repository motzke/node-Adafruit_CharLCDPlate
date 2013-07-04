/*
** CONSTANTS
*/

// https://github.com/adafruit/Adafruit-Raspberry-Pi-Python-Code/blob/master/Adafruit_CharLCDPlate/Adafruit_CharLCDPlate.py

// Port expander registers
var MCP23017_IOCON_BANK0    = 0x0A  // IOCON when Bank 0 active
var MCP23017_IOCON_BANK1    = 0x15  // IOCON when Bank 1 active
// These are register addresses when in Bank 1 only:
var MCP23017_GPIOA          = 0x09
var MCP23017_IODIRB         = 0x10
var MCP23017_GPIOB          = 0x19

// Port expander input pin definitions
var SELECT                  = 0
var RIGHT                   = 1
var DOWN                    = 2
var UP                      = 3
var LEFT                    = 4

// LED colors
var OFF                     = 0x00
var RED                     = 0x01
var GREEN                   = 0x02
var BLUE                    = 0x04
var YELLOW                  = RED + GREEN
var TEAL                    = GREEN + BLUE
var VIOLET                  = RED + BLUE
var WHITE                   = RED + GREEN + BLUE
var ON                      = RED + GREEN + BLUE

// LCD Commands
var LCD_CLEARDISPLAY        = 0x01
var LCD_RETURNHOME          = 0x02
var LCD_ENTRYMODESET        = 0x04
var LCD_DISPLAYCONTROL      = 0x08
var LCD_CURSORSHIFT         = 0x10
var LCD_FUNCTIONSET         = 0x20
var LCD_SETCGRAMADDR        = 0x40
var LCD_SETDDRAMADDR        = 0x80

// Flags for display on/off control
var LCD_DISPLAYON           = 0x04
var LCD_DISPLAYOFF          = 0x00
var LCD_CURSORON            = 0x02
var LCD_CURSOROFF           = 0x00
var LCD_BLINKON             = 0x01
var LCD_BLINKOFF            = 0x00

// Flags for display entry mode
var LCD_ENTRYRIGHT          = 0x00
var LCD_ENTRYLEFT           = 0x02
var LCD_ENTRYSHIFTINCREMENT = 0x01
var LCD_ENTRYSHIFTDECREMENT = 0x00

// Flags for display/cursor shift
var LCD_DISPLAYMOVE = 0x08
var LCD_CURSORMOVE  = 0x00
var LCD_MOVERIGHT   = 0x04
var LCD_MOVELEFT    = 0x00

var I2C = require('i2c');
var ADDRESS = 0x20;
var WIRE = new I2C(ADDRESS, {device: '/dev/i2c-1'});
var PORTA = 0;
var PORTB = 0;
var DDRB = 0x10;

var displayshift;
var displaymode;
var displaycontrol; 
var pollables = [ LCD_CLEARDISPLAY, LCD_RETURNHOME ];
var lo;
var hi;

var flip = [0x00, 0x10, 0x08, 0x18,
            0x04, 0x14, 0x0C, 0x1C,
            0x02, 0x12, 0x0A, 0x1A,
            0x06, 0x16, 0x0E, 0x1E];

function _send (cmd, values) {
    console.log("writing " + JSON.stringify(values) + " to "+ cmd);
    return WIRE.writeBytes(cmd, values);
}

function _read (cmd, length, callback) {
      return WIRE.readBytes(cmd, length, callback);
}

function out4(bitmask, value){
    hi = bitmask | flip[value >> 4];
    lo = bitmask | flip[value & 0x0F];
    return [ hi | 0x20, hi, lo | 0x20, lo];
}

function init(){
    _send(MCP23017_IOCON_BANK1, 0);

    _send(0, [ 0x3F, // IODIRA R+G LEDs=outputs, buttons=inputs
                DDRB , // IODIRB LCD D7=input, Blue LED=output
                0x3F, // IPOLA Invert polarity on button inputs
                0x0, // IPOLB
                0x0, // GPINTENA Disable interrupt-on-change
                0x0, // GPINTENB
                0x0, // DEFVALA
                0x0, // DEFVALB
                0x0, // INTCONA
                0x0, // INTCONB
                0x0, // IOCON
                0x0, // IOCON
                0x3F, // GPPUA Enable pull-ups on buttons
                0x0, // GPPUB
                0x0, // INTFA
                0x0, // INTFB
                0x0, // INTCAPA
                0x0, // INTCAPB
                PORTA, // GPIOA
                PORTB, // GPIOB
                PORTA, // OLATA 0 on all outputs; side effect of
                PORTB ] ); // OLATB     turning on R+G+B backlight LEDs.

    _send(MCP23017_IOCON_BANK0, 0xA0);

    displayshift = (LCD_CURSORMOVE |
                               LCD_MOVERIGHT);
    displaymode = (LCD_ENTRYLEFT |
                               LCD_ENTRYSHIFTDECREMENT);
    displaycontrol = (LCD_DISPLAYON |
                               LCD_CURSOROFF |
                               LCD_BLINKOFF);
    write(0x33) // Init
    write(0x32) // Init
    write(0x28) // 2 line 5x8 matrix
    write(LCD_CURSORSHIFT | displayshift)
    write(LCD_ENTRYMODESET | displaymode)
    write(LCD_DISPLAYCONTROL | displaycontrol)
    write(LCD_RETURNHOME)    

}


function write(value, char_mode){
    char_mode = char_mode || false;
    if(DDRB & 0x10){
        lo = (PORTB & 0x1) | 0x40;
        hi = lo | 0x20; // E=1 (strobe)
        _send(MCP23017_GPIOB, lo);
        while(true){
            WIRE.writeByte(hi);
            bits = WIRE.readByte();
            _send(MCP23017_GPIOB, [lo, hi, lo]);
            if ((bits & 0x2) === 0 ){
                break;
            }
        }
        PORTB = lo;
        DDRB &= 0xEF;
        _send(MCP23017_IODIRB, DDRB);
    }
    bitmask = PORTB & 0x01;
    if (char_mode){
        bitmask |= 0x80;
    }
    if(typeof value === "string" ){
        // If string or list, iterate through multiple write ops
        console.log("writing string");
        var last = value.length;
        var data = [];
        for(var k=0; k<value.length; k++){
            data.push(out4(bitmask, value[k].charCodeAt(0)));
            if(data.length >=32 || k == last){
                console.log("Sendig char array : "+ JSON.stringify(data));
                _send(MCP23017_GPIOB, data);
                PORTB = data[-1];
                data = [];
            }
        }

    }
    else{
        // single byte 
        data = out4(bitmask, value);
        _send(MCP23017_GPIOB, data);
        PORTB = data[-1];
    }

    if(!char_mode && pollables.indexOf(value)!=-1 ){
        DDRB |= 0x10;
        _send(MCP23017_IODIRB, DDRB);
    }

}

function clear(){
    write(LCD_CLEARDISPLAY);
}

function backlight(color){
    c = ~color;
    PORTA = (PORTA & 0x3F) | ( ( c & 0x3 ) << 6);
    PORTB = (PORTB & 0xFE) | ( ( c & 0x4 ) >> 2);
    _send(MCP23017_GPIOA, PORTA);
    _send(MCP23017_GPIOB, PORTB);
}

function message(text){
    lines = text.split('\n');
    for(var m=0; m<lines.length; m++){
        if(m>0){
            write(0xC0);
        }
        console.log(lines[m]);
        write(lines[m], true);
    }
}

init();
clear();
message("Hallo test");
setTimeout(backlight(VIOLET), 1000);
