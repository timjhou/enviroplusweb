/* EnviroPlusWeb */
const frequencies = {
  "5min": { major: 300, minor: 60, poll: 1 },
  day: { major: 3 * 3600, minor: 3600, poll: 60 },
  week: { major: 24 * 3600, minor: 6 * 3600, poll: 600 },
  month: { major: 7 * 24 * 3600, minor: 24 * 3600, poll: 1440 },
  year: { major: 31 * 24 * 3600, minor: 7 * 24 * 3600, poll: 17280 },
};
const gas_sensor = body.dataset.hasgassensor;
const particulate_sensor = body.dataset.hasparticulatesensor;
const fan_gpio = body.dataset.hasfangpio;
var last_frequency = "";
var last_graph = 0;
var hasThemeLight = body.classList.contains("theme-light");
const style = getComputedStyle(document.body);
// All colors values are declared at main.css
const items_ngp = [
  {
    name: "temp",
    colour: style.getPropertyValue("--color-red"),
    min: 0,
    max: 50,
  },
  {
    name: "humi",
    colour: style.getPropertyValue("--color-blue"),
    min: 0,
    max: 100,
  },
  {
    name: "pres",
    colour: style.getPropertyValue("--color-green"),
    min: 950,
    max: 1050,
  },
  {
    name: "lux",
    colour: style.getPropertyValue("--color-yellow"),
    min: 0,
    max: 25000,
  },
];
const items_g = [
  {
    name: "nh3",
    colour: style.getPropertyValue("--color-violet"),
    min: 0,
    max: 600,
  },
  {
    name: "oxi",
    colour: style.getPropertyValue("--color-turquoise"),
    min: 0,
    max: 400,
  },
  {
    name: "red",
    colour: style.getPropertyValue("--color-orange"),
    min: 0,
    max: 1000,
  }
];
const items_p = [
  {
    name: "pm10",
    colour: style.getPropertyValue("--color-dust10"),
    min: 0,
    max: 750,
  },
  {
    name: "pm25",
    colour: style.getPropertyValue("--color-dust25"),
    min: 0,
    max: 750,
  },
  {
    name: "pm100",
    colour: style.getPropertyValue("--color-dust100"),
    min: 0,
    max: 750,
  },
];
var firstLayoutRender = true;
var containerCanvas;
var canvas;
var ctx;
var dataGraph;
var dataReadings;
const yScaleSteps = 10;
const yLabelHeight = 10;
const xLabelHeight = 15;
var xScale;
var yScale;
const yLabelWidth = 25;
const themeLightBtn = document.getElementById("theme-light");
const themeDarkBtn = document.getElementById("theme-dark");

// Manages theme color
function changeColorTheme() {
  body.className = this.id;
  localStorage.setItem("theme-color", this.id);
  hasThemeLight = !hasThemeLight;
  getGraph(true);
}
themeLightBtn.onclick = changeColorTheme;
themeDarkBtn.onclick = changeColorTheme;

// Request to get the readings data
function getData() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function () {
    if (this.readyState == 4 && this.status == 200) {
      // console.log('Readings data: ', JSON.parse(this.responseText));
      listReadings(JSON.parse(this.responseText));
    }
  };
  if (fan_gpio) {
    var fan = document.getElementById("fan").value;
    xhttp.open("GET", "readings?fan=" + fan, true);
  } else {
    xhttp.open("GET", "readings", true);
  }
  xhttp.send();
}

// Load the data in the readings tables
function listReadings(d) {
  dataReadings = d;
  for (var i = 0; i < Object.keys(dataReadings).length; i++) {
    var dataKey = Object.keys(dataReadings)[i];
    var elementIdKey = document.getElementById(dataKey);
    var dataValue = Object.values(dataReadings)[i];
    if (typeof elementIdKey != "undefined" && elementIdKey != null) {
      elementIdKey.innerHTML = dataValue;
      /*
      if(dataKey === 'time'){
        // Transform date and time in local format
        elementIdKey.innerHTML = new Date(dataValue).toLocaleString(navigator.language);
      }else{
        elementIdKey.innerHTML = dataValue;
      }
      */
    }
  }
}

// Load the scale factors in the readings tables
function listScaleFactors(item) {
  var itemIdKey = document.getElementById(item.name + '-scale');
  var itemValue = (item.max - item.min);
  if (typeof itemIdKey != "undefined" && itemIdKey != null) {
    itemIdKey.innerHTML = '/' + itemValue;
  }
}

// Request to get the graph data
function getGraph(param) {
  var frequency = document.getElementById("graph-sel").value;
  var t = Date.now() / 1000;
  if (
    frequency != last_frequency ||
    t - last_graph >= frequencies[frequency].poll ||
    param
  ) {
    last_frequency = frequency;
    last_graph = t;
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        // console.log('Graph data: ', JSON.parse(this.responseText))
        graph(JSON.parse(this.responseText));
      }
    };
    xhttp.open("GET", "graph?time=" + frequency, true);
    xhttp.send();
  }
}

// Draw the background grid and labels
function graph(d) {
  dataGraph = d;
  containerCanvas = document.getElementById("container-graph");
  canvas = document.getElementById("canvas-graph");
  if (firstLayoutRender) {
    canvas.height = containerCanvas.offsetHeight;
    canvas.width = containerCanvas.offsetWidth;
    firstLayoutRender = false;
  }

  ctx = canvas.getContext("2d");
  // Color of the graph labels
  ctx.fillStyle = hasThemeLight
    ? style.getPropertyValue("--color-gray")
    : style.getPropertyValue("--color-gray-dark");
  ctx.font = "20 pt Verdana";

  yScale = canvas.height - yLabelHeight - xLabelHeight;
  xScale = (canvas.width - yLabelWidth) / (dataGraph.length - 1);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Print X axis vertical time lines
  var frequency = document.getElementById("graph-sel").value;
  var major = frequencies[frequency].major;
  var minor = frequencies[frequency].minor;
  var show_date = major >= 24 * 3600;
  const months = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };
  ctx.textAlign = "center";
  for (var i = 0; i < dataGraph.length; i++) {
    var fields = dataGraph[i]["time"].match(/\S+/g); // split is broken!
    var t = fields[3].split(":");
    var date = months[fields[1]] * 31 + parseInt(fields[2]) - 1;
    var time =
      date * 24 * 3600 +
      parseInt(t[0]) * 3600 +
      parseInt(t[1]) * 60 +
      parseInt(t[2]);
    if (time % minor == 0) {
      var is_major = time % major == 0;
      var x = i * xScale + yLabelWidth;
      if (is_major)
        ctx.fillText(
          show_date
            ? fields[0] + " " + fields[1] + " " + fields[2]
            : fields[3].slice(0, 5),
          x,
          canvas.height
        );
      ctx.beginPath();
      // Color of vertical grid lines
      if (hasThemeLight) {
        ctx.strokeStyle = is_major
          ? style.getPropertyValue("--color-gray")
          : style.getPropertyValue("--color-gray-light");
      } else {
        ctx.strokeStyle = is_major
          ? style.getPropertyValue("--color-gray-dark")
          : style.getPropertyValue("--color-gray-darker");
      }
      ctx.setLineDash([5, 3]);
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height - xLabelHeight);
      ctx.stroke();
    }
  }

  // Print Y axis labels and draw horizontal grid lines
  ctx.beginPath();
  // Color of horizontal grid lines
  ctx.strokeStyle = hasThemeLight
    ? style.getPropertyValue("--color-gray-light")
    : style.getPropertyValue("--color-gray-darker");
  ctx.textAlign = "left";
  for (var i = 0; i <= yScaleSteps; i++) {
    var y = (yScale * (yScaleSteps - i)) / yScaleSteps + yLabelHeight - 1;
    ctx.fillText(i / yScaleSteps, yLabelHeight, y);
    ctx.moveTo(yLabelWidth, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();

  // Plot each item
  var items = particulate_sensor
    ? items_ngp.concat(items_g).concat(items_p)
    : gas_sensor
      ? items_ngp.concat(items_g)
      : items_ngp;
  for (var item of items) {
    ctx.strokeStyle = item.colour;
    plotData(item.name, item.min, item.max);
    listScaleFactors(item);
  }

}

// Draw each reading value on the grid
function plotData(dataSet, min, max) {
  ctx.beginPath();
  ctx.setLineDash([]);
  y0 = canvas.height - xLabelHeight;
  ctx.moveTo(yLabelWidth, y0 - scaley(dataGraph[0][dataSet], min, max));
  for (var i = 1; i < dataGraph.length; i++) {
    ctx.lineTo(
      yLabelWidth + i * xScale,
      y0 - scaley(dataGraph[i][dataSet], min, max)
    );
  }
  ctx.stroke();
}

// Calculate the place on the Y axis between the ranges min/max
function scaley(y, min, max) {
  return ((y - min) * yScale) / (max - min);
}

// Update the graph layout (width/height) if window resize
window.addEventListener('resize', function () {
  var resizeId;
  clearTimeout(resizeId);
  resizeId = setTimeout(doneResizing, 500);
});
function doneResizing() {
  firstLayoutRender = true;
  getGraph(true);
}

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
