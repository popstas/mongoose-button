load('api_config.js');
load('api_esp8266.js');
load('api_gpio.js');
load('api_http.js');
// load('api_mqtt.js');
// load('api_sys.js');
load('api_timer.js');

let requestUrl = Cfg.get('app.webhook');

function blink(time) {
  GPIO.blink(Cfg.get('app.led_pin'), time, time);
}

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

GPIO.setup_output(Cfg.get('app.led_pin'), 1);

if (!requestUrl) {
  print('No requestUrl defined! you should define it with mos config-set webhook=https://your-url');
  blink(250);
  return false;
}

GPIO.set_button_handler(
  Cfg.get('app.button_pin'),
  GPIO.PULL_UP,
  GPIO.INT_EDGE_NEG,
  50,
  requestWebhook,
  true
);

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
}, null); */
