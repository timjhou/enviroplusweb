# 🌿 Enviro Plus Web

Web interface for [Enviro](https://shop.pimoroni.com/products/enviro?variant=31155658489939) and [Enviro+](https://shop.pimoroni.com/products/enviro?variant=31155658457171) sensor board plugged into a Raspberry Pi.  
This simple webapp serves a page with the current sensor readings in a graph over a specified time period.  
Runs thanks to [Flask](https://flask.palletsprojects.com) and [Chart.js](https://www.chartjs.org/)

![Screenshot](screenshot-lightTheme.jpg)

![Screenshot](screenshot-darkTheme.jpg)

Forked from <https://github.com/nophead/EnviroPlusWeb>

⚠️ Enviro readings must not be relied upon for critical applications.

## 📖 User guide

### Install

To use the Enviro board, you’ll need to install its Python library.  
Open a Terminal window and enter the following commands:

```console
git clone https://github.com/pimoroni/enviroplus-python

cd enviroplus-python

sudo ./install.sh

sudo pip install smbus2
```

Once that’s all done, enter `sudo reboot` to restart your Raspberry Pi to apply the changes.  
The install script enables I2C, SPI, and serial, disables the serial console, and enables the mini UART interface that Raspberry Pi uses to talk to the PMS5003 particulate sensor.

To check that everything is working correctly, go to the enviroplus-python folder and run the all-in-one example:

```console
cd enviroplus-python

cd examples

python all-in-one.py
```

Tap your finger on the board’s light sensor to cycle through data from different sensors being displayed on its LCD. When you’re happy it’s all working, press CTRL+C to stop the program.

You can now install the EnviroPlusWeb, from a Terminal window enter:

```console
cd

git clone https://gitlab.com/idotj/enviroplusweb.git

sudo pip install flask
```

Now you are ready to run your EnviroPlusWeb. Just type:

```console
sudo python3 enviroplusweb.py
```

Open your browser and type the IP address of your Raspberry Pi, example: `http://192.168.1.142/`

### Setup

Check at the beginning of the file `enviroplusweb.py` the following lines and choose `True` or `False` depending on your config:

- If you have an Enviro board without gas sensor, edit this line

  ```python
  gas_sensor = False
  ```

- If you don't have a particulate sensor [PMS5003](https://shop.pimoroni.com/products/pms5003-particulate-matter-sensor-with-cable?variant=29075640352851) attached, edit this line

  ```python
  particulate_sensor = False
  ```

- If you prefer to keep the Enviro LCD screen off, edit this line

  ```python
  lcd_screen = False
  ```

- If you don't have a fan plugged on GPIO, edit this line

  ```python
  fan_gpio = False
  ```

- If you need temperature and humidity compensation, edit this line

  ```python
  temp_humi_compensation = True
  ```

Without a fan, temperature and humidity readings are not very accurate and will vary depending on how you assambled your Enviro board with your Raspberry Pi.  
Find an alternative device/reference to measure the temperature and humidity. Then if needed you can compensate them changing the `factor_temp` and `factor_humi` values.

### Extra setup

Maybe you want to run Enviro Plus Web at boot, then just type in the terminal:

```console
crontab -e
```

Add a new entry at the very bottom with `@reboot` to specify that you want to run the command at boot, followed by the path where you clone the project.  
Here you have an example:

```console
@reboot sudo python3 /home/pi/enviroplusweb/enviroplusweb.py &
```

## 🚀 Improve me

Feel free to add/improve the app and add more features.

## ⚖️ License

GNU General Public License v3.0

## 💬 FAQ

### Where are my data readings saved?

Depends on where you run `enviroplusweb.py`. By default your data will be stored in the same place where you have the application, in a JSON format inside a folder called `/enviro-data`.  
But if you run the app at bootup (for example, using the _crontab_) then your folder `/enviro-data` will be at `/home/pi` (if your default user is 'pi').

### How can I get my Raspberry Pi IP?

Enter `hostname -I` in a Terminal window on your Raspberry Pi, then you will see the IPv4 and the IPv6.

### My Raspberry Pi is running other services at localhost

You can change the port to avoid any conflict with other applications. In that case edit the file `enviroplusweb.py` and find at the end this line:

```python
app.run(debug = False, host = '0.0.0.0', port = 80, use_reloader = False)
```

Just change the `port = 80` value for another number (for example `81`) and now you can access to your EnviroPlusWeb typing the ip address followed by :81

### I want to run my EnviroPlusWeb under HTTPS

By default you use HTTP to connect to your Raspberry Pi through your browser, but some browsers will redirect automatically to HTTPS. If you prefer to have your project running under HTTPS here you have a tutorial explaning how to setup Flask with HTTPS:

<https://blog.miguelgrinberg.com/post/running-your-flask-application-over-https>

### Other answered questions

Check the [closed issues](https://gitlab.com/idotj/enviroplusweb/-/issues/?sort=created_date&state=closed&first_page_size=20), you might find your question there.  
If nothing matches with your problem, check the [open issues](https://gitlab.com/idotj/enviroplusweb/-/issues/?sort=created_date&state=opened&first_page_size=20) or feel free to create a new one.
