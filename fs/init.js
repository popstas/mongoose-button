// mongoose-button-bme
load('api_arduino_bme280.js');
load('api_arduino_ssd1306.js');
load('api_config.js');
load('api_esp8266.js');
load('api_adc.js');
load('api_gpio.js');
load('api_i2c.js');
load('api_http.js');
load('api_mqtt.js');
// load('api_sys.js');
load('api_timer.js');

/* let rescuePin = 3; // D3;
GPIO.set_mode(rescuePin, GPIO.MODE_INPUT);
print('rescuePin: ');
print(GPIO.read(rescuePin));
if(GPIO.read(rescuePin)){
  print('rescue pin enabled, aborting program!');
  return false;
} */

let requestUrl = Cfg.get('app.webhook');

function blink(time) {
  GPIO.blink(Cfg.get('app.led_pin'), time, time);
}

// request to Cfg.get('app.webhook')
function requestWebhook() {
  print('HTTP query to ' + requestUrl);
  blink(500);
  HTTP.query({
    url: requestUrl,
    success: function() {
      print('HTTP request sent');
    },
    error: function() {
      blink(250);
      print('HTTP request failed');
    }
  });

  Timer.set(
    Cfg.get('app.blink_timeout'),
    false,
    function() {
      blink(0);
    },
    null
  );
}

// mqtt test
MQTT.setEventHandler(function(conn, ev, edata) {
  if (ev !== 0) print('MQTT event handler: got', ev);
}, null);

GPIO.setup_output(Cfg.get('app.led_pin'), 1);

// button webhook
if (requestUrl) {
  GPIO.set_button_handler(
    Cfg.get('app.button_pin'),
    GPIO.PULL_UP,
    GPIO.INT_EDGE_NEG,
    50,
    requestWebhook,
    true
  );
} else {
  print('No requestUrl defined! you should define it with mos config-set webhook=https://your-url');
  // blink(250);
}

let last = {
  temp: "0",
  hum: "0",
  press: "0",
  brightness: "0",
  lux: "0"
};

// BME280 sensor
let sens_addr = 0x76;
// let sens_addr = 0x77;
print('connect bme...');
let bme;
bme = Adafruit_BME280.createI2C(sens_addr); 
if (bme === undefined) {
  print('Cant find a sensor');
} else {
  print('bme280 connected!');
}

// MAX44009 (GY-49) light sensor
print('Init GY-49');
let gy49_addr = 74; //0x4A;
let gy49 = I2C.get();
// 0x02 - Configuration register
// 0x00 - Automatic mode, Integration time = 800 ms, for low-light
// 0x40 - Manual mode
I2C.writeRegB(gy49, gy49_addr, 0x02, 0x00);

function gy49_read() {
  // let data = I2C.readRegN(gy49, gy49_addr, 0x03);
  let data1 = I2C.readRegB(gy49, gy49_addr, 0x03);
  let data2 = I2C.readRegB(gy49, gy49_addr, 0x04);
  // print('data1: ', data1);
  // print('data2: ', data2);
    
  // Convert the data to lux
  let exponent = (data1 & 0xF0) >> 4;
  let mantissa = ((data1 & 0x0F) << 4) | (data2 & 0x0F);
  let luminance = Math.pow(2, exponent) * mantissa * 0.045;
  // print('exponent: ', exponent);
  // print('mantissa: ', mantissa);
  return luminance;
}

Timer.set(
  1000,
  true,
  function() {
    let data = {
      temperature: bme.readTemperature(),
      humidity: bme.readHumidity(),
      pressure: bme.readPressure(),
      brightness: ADC.read(0) / 1024 * 100,
      lux: gy49_read()
    };

    
    let current = {
      temp: JSON.stringify(Math.round(data.temperature)),
      hum: JSON.stringify(Math.round(data.humidity)),
      press: JSON.stringify(Math.round(data.pressure)),
      brightness: JSON.stringify(Math.round(data.brightness)),
      lux: JSON.stringify(Math.round(data.lux))
    };

    // serial output
    print('brightness: ', data.brightness);
    print('bme280 temperature: ', data.temperature);
    print('bme280 humidity: ', data.humidity);
    print('bme280 pressure: ', data.pressure);
    print('gy-49 lux: ', data.lux);

    // oled display
    /* showStr(
      d,
      'tmp: ' +
      current.temperature +
        '\nhum: ' +
        current.humidity +
        '\nprs: ' +
        current.pressure
    ); */

    let base = Cfg.get('app.mqtt_base');

    // publish to mqtt metrics if changed
    let names = ['temp', 'hum', 'press', 'brightness', 'lux'];
    for(let i in names){
      let m = names[i];
      if(current[m] !== last[m]){
        print('mqtt: ' + m + ': ' + current[m] + ', last: ' + last[m]);
        MQTT.pub(base + '/' + m, current[m]);
      }
      last[m] = current[m];
    }
  },
  null
);

// display
// print('initialize display...');
// let d = Adafruit_SSD1306.create_i2c(4, Adafruit_SSD1306.RES_128_64);
// d.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3c, true /* reset */);
// d.display();

// let showStr = function(d, str) {
//   d.clearDisplay();
//   d.setTextSize(2);
//   d.setTextColor(Adafruit_SSD1306.WHITE);
//   d.setCursor(0, 0);
//   d.write(str);
//   d.display();
// };

// wifi connect event
/* Event.addGroupHandler(
  Net.EVENT_GRP,
  function(ev, data) {
    if (ev !== Net.STATUS_GOT_IP) return;
    requestWebhook();
  },
  null
); */
