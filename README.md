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
```
