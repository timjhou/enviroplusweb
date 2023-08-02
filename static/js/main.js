/* EnviroPlusWeb */
const frequencies = {
  day: { major: 3 * 3600, minor: 3600, poll: 60 },
  week: { major: 24 * 3600, minor: 6 * 3600, poll: 600 },
  month: { major: 7 * 24 * 3600, minor: 24 * 3600, poll: 1440 },
  year: { major: 31 * 24 * 3600, minor: 7 * 24 * 3600, poll: 17280 },
};
const gas_sensor = body.dataset.hasgassensor;
const particulate_sensor = body.dataset.hasparticulatesensor;
const fan_gpio = body.dataset.hasfangpio;
let hasThemeLight = body.classList.contains("theme-light");
const themeLightBtn = document.getElementById("theme-light");
const themeDarkBtn = document.getElementById("theme-dark");
const style = getComputedStyle(document.body);
// All colors values are declared at main.css
const items_ngp = {
  temp: {
    id: "temp",
    label: "Temperature",
    unit: "°C",
    color: style.getPropertyValue("--color-red"),
    min: 0,
    max: 50,
  },
  humi: {
    id: "humi",
    label: "Humidity",
    unit: "%",
    color: style.getPropertyValue("--color-blue"),
    min: 0,
    max: 100,
  },
  pres: {
    id: "pres",
    label: "Pressure",
    unit: "hPa",
    color: style.getPropertyValue("--color-green"),
    min: 950,
    max: 1050,
  },
  lux: {
    id: "lux",
    label: "Light",
    unit: "lux",
    color: style.getPropertyValue("--color-yellow"),
    min: 0,
    max: 25000,
  },
};
const items_gas = {
  nh3: {
    id: "nh3",
    label: "NH3",
    unit: "kΩ",
    color: style.getPropertyValue("--color-violet"),
    min: 0,
    max: 600,
  },
  oxi: {
    id: "red",
    label: "Reducing",
    unit: "kΩ",
    color: style.getPropertyValue("--color-turquoise"),
    min: 0,
    max: 400,
  },
  red: {
    id: "oxi",
    label: "Oxidising",
    unit: "kΩ",
    color: style.getPropertyValue("--color-orange"),
    min: 0,
    max: 1000,
  },
};
const items_pm = {
  pm10: {
    id: "pm10",
    label: "PM10.0",
    unit: "μg/m3",
    color: style.getPropertyValue("--color-dust10"),
    min: 0,
    max: 750,
  },
  pm25: {
    id: "pm25",
    label: "PM2.5",
    unit: "μg/m3",
    color: style.getPropertyValue("--color-dust25"),
    min: 0,
    max: 750,
  },
  pm100: {
    id: "pm100",
    label: "PM100",
    unit: "μg/m3",
    color: style.getPropertyValue("--color-dust100"),
    min: 0,
    max: 750,
  },
};
let items;
if (particulate_sensor) {
  items = { ...items_ngp, ...items_gas, ...items_pm };
} else {
  if (gas_sensor) {
    items = { ...items_ngp, ...items_gas };
  } else {
    items = items_ngp;
  }
}
let firstRun = true;
let dataReadings;
let transformedData;
let frequency;
let last_frequency = "";
let last_graph = 0;
const ctxTemp = document.getElementById("graphChartTemp");
const ctxHumi = document.getElementById("graphChartHumi");
const ctxPres = document.getElementById("graphChartPres");
const ctxLux = document.getElementById("graphChartLux");
const ctxGas = document.getElementById("graphChartGas");
const ctxPm = document.getElementById("graphChartPm");
let graphChartTemp;
let graphChartHumi;
let graphChartPres;
let graphChartLux;
let graphChartGas;
let graphChartPm;

// Request to get readings data
function getData() {
  let xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      // console.log('getData(): ', JSON.parse(this.responseText));
      listReadings(JSON.parse(this.responseText));
    }
  };
  if (fan_gpio) {
    let fan = document.getElementById("fan").value;
    xhttp.open("GET", "readings?fan=" + fan, true);
  } else {
    xhttp.open("GET", "readings", true);
  }
  xhttp.send();
}

// Show live readings data in readings tables
function listReadings(d) {
  dataReadings = d;
  for (let i = 0; i < Object.keys(dataReadings).length; i++) {
    let dataKey = Object.keys(dataReadings)[i];
    let elementIdKey = document.getElementById(dataKey);
    let dataValue = Object.values(dataReadings)[i];
    if (typeof elementIdKey != "undefined" && elementIdKey != null) {
      elementIdKey.innerHTML = dataValue;
      if (dataKey === "temp") {
        const temp_f = dataValue * 1.8 + 32;
        document.getElementById("temp-f").innerHTML = temp_f.toFixed(1);
      }
    }
  }
}

// Request to get graph data
function getGraph() {
  frequency = document.getElementById("graph-sel").value;
  let t = Date.now() / 1000;
  if (
    frequency != last_frequency ||
    t - last_graph >= frequencies[frequency].poll
  ) {
    last_frequency = frequency;
    last_graph = t;
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // console.log('getGraph(): ', JSON.parse(this.responseText));
        transformedData = JSON.parse(this.responseText).map((element) => {
          return {
            // Normalize data for the graph
            time: new Date(element.time).toISOString(),
            temp: element.temp,
            humi: element.humi,
            pres: element.pres,
            lux: element.lux,
            nh3: element.nh3,
            red: element.red,
            oxi: element.oxi,
            pm10: element.pm10,
            pm100: element.pm100,
            pm25: element.pm25,
          };
        });

        if (!firstRun) {
          destroyAllCharts();
        } else {
          firstRun = false;
        }
        drawGraph(transformedData);
      }
    };

    xhttp.open("GET", "graph?time=" + frequency, true);
    xhttp.send();
  }
}

// Reload graph chart
function destroyAllCharts() {
  graphChartTemp.destroy();
  graphChartHumi.destroy();
  graphChartPres.destroy();
  graphChartLux.destroy();
  if (gas_sensor) graphChartGas.destroy();
  if (particulate_sensor) graphChartPm.destroy();
}

// Draw graph with data
function drawGraph(data) {
  // console.log("drawGraph(): ", data);

  // Change time range to read better the X axis
  let graphfrequency;
  switch (frequency) {
    case "day":
      graphfrequency = "hour";
      break;
    case "week":
      graphfrequency = "day";
      break;
    case "month":
      graphfrequency = "day";
      break;
    case "year":
      graphfrequency = "month";
      break;
    default:
      graphfrequency = frequency;
      break;
  }

  // Push data for chartJS
  graphChartTemp = new Chart(ctxTemp, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.temp.id,
          data: data,
          parsing: {
            yAxisKey: items.temp.id,
          },
          borderColor: items.temp.color,
          borderWidth: 2,
          pointBackgroundColor: items.temp.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.9,
      maintainAspectRatio: false,
      scales: {
        y: {
          grace: "90%",
          ticks: {
            callback: function (value) {
              return value + items.temp.unit;
            },
          },
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxTemp.classList.remove("loading-spinner");
        },
      },
    },
  });

  graphChartHumi = new Chart(ctxHumi, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.humi.id,
          data: data,
          parsing: {
            yAxisKey: items.humi.id,
          },
          borderColor: items.humi.color,
          borderWidth: 2,
          pointBackgroundColor: items.humi.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.3,
      maintainAspectRatio: false,
      scales: {
        y: {
          grace: "90%",
          ticks: {
            stepSize: 5,
            callback: function (value) {
              return value + items.humi.unit;
            },
          },
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxHumi.classList.remove("loading-spinner");
        },
      },
    },
  });

  graphChartPres = new Chart(ctxPres, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.pres.id,
          data: data,
          parsing: {
            yAxisKey: items.pres.id,
          },
          fill: items.pres.color,
          borderColor: items.pres.color,
          borderWidth: 2,
          pointBackgroundColor: items.pres.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.6,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: items.pres.min,
          max: items.pres.max,
          ticks: {
            stepSize: 20,
            callback: function (value) {
              return value + " " + items.pres.unit;
            },
          },
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxPres.classList.remove("loading-spinner");
        },
      },
    },
  });

  graphChartLux = new Chart(ctxLux, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.lux.id,
          data: data,
          parsing: {
            yAxisKey: items.lux.id,
          },
          borderColor: items.lux.color,
          borderWidth: 2,
          pointBackgroundColor: items.lux.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.2,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          grace: "40%",
          ticks: {
            stepSize: 100,
            callback: function (value) {
              return value + " " + items.lux.unit;
            },
          },
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxLux.classList.remove("loading-spinner");
        },
      },
    },
  });

graphChartGas = new Chart(ctxGas, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.nh3.id,
          data: data,
          parsing: {
            yAxisKey: items.nh3.id,
          },
          yAxisID: "y",
          borderColor: items.nh3.color,
          borderWidth: 2,
          pointBackgroundColor: items.nh3.color,
          pointRadius: 1,
        },
        {
          label: items.red.id,
          data: data,
          parsing: {
            yAxisKey: items.red.id,
          },
          yAxisID: "y1",
          borderColor: items.red.color,
          borderWidth: 2,
          pointBackgroundColor: items.red.color,
          pointRadius: 1,
        },
        {
          label: items.oxi.id,
          data: data,
          parsing: {
            yAxisKey: items.oxi.id,
          },
          yAxisID: "y2",
          borderColor: items.oxi.color,
          borderWidth: 2,
          pointBackgroundColor: items.oxi.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.2,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: items.oxi.min,
          max: items.oxi.max,
          ticks: {
            callback: function (value) {
              return value + " " + items.oxi.unit;
            },
          },
        },
        y1: {
          display: false,
        },
        y2: {
          display: false,
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxGas.classList.remove("loading-spinner");
        },
      },
    },
  });

  graphChartPm = new Chart(ctxPm, {
    type: "line",
    data: {
      datasets: [
        {
          label: items.pm10.id,
          data: data,
          parsing: {
            yAxisKey: items.pm10.id,
          },
          yAxisID: "y",
          borderColor: items.pm10.color,
          borderWidth: 2,
          pointBackgroundColor: items.pm10.color,
          pointRadius: 1,
        },
        {
          label: items.pm100.id,
          data: data,
          parsing: {
            yAxisKey: items.pm100.id,
          },
          yAxisID: "y1",
          borderColor: items.pm100.color,
          borderWidth: 2,
          pointBackgroundColor: items.pm100.color,
          pointRadius: 1,
        },
        {
          label: items.pm25.id,
          data: data,
          parsing: {
            yAxisKey: items.pm25.id,
          },
          yAxisID: "y2",
          borderColor: items.pm25.color,
          borderWidth: 2,
          pointBackgroundColor: items.pm25.color,
          pointRadius: 1,
        },
      ],
    },
    options: {
      bezierCurve: true,
      tension: 0.2,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: items.pm10.min,
          max: items.pm10.max,
          ticks: {
            callback: function (value) {
              return value + " " + items.pm100.unit;
            },
          },
        },
        y1: {
          min: items.pm100.min,
          max: items.pm100.max,
          display: false,
        },
        y2: {
          min: items.pm25.min,
          max: items.pm25.max,
          display: false,
        },
        x: {
          type: "time",
          time: {
            unit: graphfrequency,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
      parsing: {
        xAxisKey: "time",
      },
      animation: {
        onComplete: function () {
          ctxPm.classList.remove("loading-spinner");
        },
      },
    },
  });
}

// Manages theme color
function changeColorTheme() {
  body.className = this.id;
  localStorage.setItem("theme-color", this.id);
  hasThemeLight = !hasThemeLight;
}
themeLightBtn.onclick = changeColorTheme;
themeDarkBtn.onclick = changeColorTheme;

// Control main menu (mobile)
const menuMainBtn = document.getElementById("menu-hamburger");
const menuMainContainer = document.getElementById("container-menu-settings");
// Toggle menu by icon click
menuMainBtn.addEventListener("click", function () {
  this.classList.toggle("btn-active");
  this.setAttribute("aria-expanded", this.classList.contains("btn-active"));
  menuMainContainer.classList.toggle("menu-settings-open");
  // Detect outside click
  document.addEventListener("click", function clickOutsideMenu(event) {
    let clickMenuContainer = menuMainContainer.contains(event.target);
    let clickMenuBtn = menuMainBtn.contains(event.target);
    if (
      !clickMenuContainer &&
      !clickMenuBtn &&
      menuMainContainer.classList.contains("menu-settings-open")
    ) {
      // Close menu
      menuMainBtn.classList.toggle("btn-active");
      menuMainBtn.setAttribute(
        "aria-expanded",
        menuMainBtn.classList.contains("btn-active")
      );
      menuMainContainer.classList.toggle("menu-settings-open");
      document.removeEventListener("click", clickOutsideMenu);
    }
  });
});

// Call a function repetitively with 1 second interval
setInterval(function () {
  getData();
  getGraph();
}, 900); // ~1s update rate

window.addEventListener("resize", function(){
  destroyAllCharts();
  drawGraph(transformedData);
});