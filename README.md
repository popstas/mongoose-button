# Webhook wifi button

Emit webhook call on every boot. "Button" means reset. Request to webhook doing 10-12 sec after button press.

## Quick start

```
git clone https://github.com/popstas/mongoose-button
cd mongoose-button
mos build --platform esp8266
mos flash
mos wifi ssid pass
mod config-set app.webhook=https://your-url
# for mDash
config-set dash.enable=true dash.token=your-token
# for mqtt
mos config-set mqtt.enable=true
mos config-set mqtt.server=myserver
mos config-set mqtt.user=myuser
mos config-set mqtt.pas=mypass
mos config-set app.mqtt_base=home/room
```
