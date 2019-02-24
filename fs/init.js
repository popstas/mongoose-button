load('api_arduino_bme280.js');
load('api_arduino_ssd1306.js');
load('api_config.js');
load('api_esp8266.js');
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
  blink(250);
}

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
  Timer.set(
    5000,
    true,
    function() {
      let data = {
        temperature: bme.readTemperature(),
        humidity: bme.readHumidity(),
        pressure: bme.readPressure()
      };

      print('bme280 temperature: ', data.temperature);
      print('bme280 humidity: ', data.humidity);
      print('bme280 pressure: ', data.pressure);

      showStr(
        d,
        'tmp: ' +
          JSON.stringify(Math.round(data.temperature)) +
          '\nhum: ' +
          JSON.stringify(Math.round(data.humidity)) +
          '\nprs: ' +
          JSON.stringify(Math.round(data.pressure))
      );

      let base = Cfg.get('app.mqtt_base');
      MQTT.pub(base + '/temp', JSON.stringify(Math.round(data.temperature)));
      MQTT.pub(base + '/hum', JSON.stringify(Math.round(data.humidity)));
      MQTT.pub(base + '/press', JSON.stringify(Math.round(data.pressure)));
    },
    null
  );
}

// PIR sensor
GPIO.set_mode(Cfg.get('app.pir_pin'), GPIO.MODE_INPUT); // D8
Timer.set(
  1000,
  true,
  function() {
    let pir = GPIO.read(Cfg.get('app.pir_pin'));

    GPIO.write(Cfg.get('app.led_pin'), Math.abs(1 - pir));

    let base = Cfg.get('app.mqtt_base');
    print(base + '/pir ' + JSON.stringify(pir));
    MQTT.pub(base + '/pir', JSON.stringify(pir));
  },
  null
);

// display
print('initialize display...');
let d = Adafruit_SSD1306.create_i2c(4, Adafruit_SSD1306.RES_128_64);
d.begin(Adafruit_SSD1306.SWITCHCAPVCC, 0x3c, true /* reset */);
d.display();

let showStr = function(d, str) {
  d.clearDisplay();
  d.setTextSize(2);
  d.setTextColor(Adafruit_SSD1306.WHITE);
  d.setCursor(0, 0);
  d.write(str);
  d.display();
};

// wifi connect event
/* Event.addGroupHandler(
  Net.EVENT_GRP,
  function(ev, data) {
    if (ev !== Net.STATUS_GOT_IP) return;
    requestWebhook();
  },
  null
); */

//trying mqtt
/* MQTT.setEventHandler(function(conn, ev, edata) {
  if (ev === MQTT.EV_CONNACK) {
    let topic = '/feeds/' + feedName;
    let ok = MQTT.pub(topic, JSON.stringify(1), 1);
    if (ok) print('sent mqtt');
    else print('failed mqtt');
    MQTT.setEventHandler(function(){}, null);
  }
}, null);
 */
