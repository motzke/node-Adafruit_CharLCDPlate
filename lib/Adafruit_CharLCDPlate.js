/*
** CONSTANTS
*/

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

var i2c = require("i2c");
var address = 0x20;
var wire = new i2c(address, {device: '/dev/i2c-1', debug: true}); 
var porta = 0;
var portb = 0;
var ddrb = 0x10;

function errorh(err) {
    console.log("Fehler!");
    console.log(error.stack);
}

wire.writeByte(MCP23017_IOCON_BANK1, errorh);

wire.writeBytes([ 0x3F, // IODIRA R+G LEDs=outputs, buttons=inputs
            self.ddrb , // IODIRB LCD D7=input, Blue LED=output
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
            self.porta, // GPIOA
            self.portb, // GPIOB
            self.porta, // OLATA 0 on all outputs; side effect of
            self.portb ], errorh);


