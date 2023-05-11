function getRandomInclusive(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function injectHTML(list) {
  console.log("fired injectHTML");
  const target = document.querySelector("#restaurant_list");
  target.innerHTML = "";
  list.forEach((item) => {
    const str = `<li>${item.street}</li>`;
    target.innerHTML += str;
  });
}

function filterList(list, query) {
  return list.filter((item) => {
    const lowerCaseName = item.street.toLowerCase();
    const lowerCaseQuery = query.toLowerCase();
    return lowerCaseName.includes(lowerCaseQuery);
  });
}

function cutRestaurantList(list) {
  console.log("fired cut list");
  const range = [...Array(5).keys()];
  return (newArray = range.map((item) => {
    const index = getRandomInclusive(0, list.length - 1);
    return list[index];
  }));
}

function initMap() {
  const carto = L.map("map").setView([40.730610, -73.935424], 9);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(carto);
  return carto;
}


function markerPlace(array, map) {
  console.log("array for markers", array);

  map.eachLayer((layer) => {
    if (layer instanceof L.Marker) {
      layer.remove();
    }
  });

  array.forEach((item, index) => {
    console.log("markerPlace", item);
    //Adds a marker to the map and blindPopup adds a title to it if you were to click on the marker
    L.marker([item.latitude, item.longitude])
      .addTo(map)
      .bindPopup((title = item.street));

    //This code shifts the view of the map to the marker position, I did this because some of the request names don't have a location
    //This will make it easier for people to see which ones do and the positioning
    if (index === 0) {
      map.setView([item.latitude, item.longitude], 10);
    }
  });
}

function initChart(chart, object) {
  const labels = Object.keys(object);
  const info = Object.keys(object).map((item) => object[item].length);

  return new Chart(chart, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '# of Votes',
        data: info,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function changeChart(chart, dataObject) {
  const labels = Object.keys(dataObject);
  const info = Object.keys(dataObject).map((item) => dataObject[item].length);
  
  chart.data.labels = labels;
  chart.data.datasets.forEach((set) => {
    set.data = info;
    return set;
  });

  chart.update();
}

function shapeDataForLineChart(array) {
  return array.reduce((collection, item) => {
    if (!collection[item.boro]) {
      collection[item.boro] = [item];
    } else {
      collection[item.boro].push(item);
    }
    return collection;
  }, {});
}

async function mainEvent() {
  const mainForm = document.querySelector(".main_form");
  const generateListButton = document.querySelector("#generate");
  const textField = document.querySelector("#resto");
  const chartTarget = document.querySelector("#myChart");

  const loadAnimation = document.querySelector("#data_load_animation");
  loadAnimation.style.display = "none";
  generateListButton.classList.add("hidden");

  const carto = initMap();

  const storedData = localStorage.getItem("storedData");

  let parsedData = JSON.parse(storedData);
  if (parsedData?.length > 0) {
    generateListButton.classList.remove("hidden");
  }

  let currentList = [];
  
  const shapedData = shapeDataForLineChart(parsedData);
  const myChart = initChart(chartTarget, shapedData);

  generateListButton.addEventListener("click", (submitEvent) => {
    submitEvent.preventDefault();
    console.log("generate new list");
    currentList = cutRestaurantList(parsedData);
    console.log(currentList);
    injectHTML(currentList);
    markerPlace(currentList, carto);
    const localData = shapeDataForLineChart(currentList);
    changeChart(myChart, localData);
  });

  textField.addEventListener("input", (event) => {
    console.log("input", event.target.value);
    const newList = filterList(currentList, event.target.value);
    console.log(newList);
    injectHTML(newList);
    markerPlace(newList, carto);
    const localData = shapeDataForLineChart(filterList(currentList, event.target.value));
    changeChart(myChart, localData);
  });

  clearDataButton.addEventListener("click", (event) => {
    console.log("clear browser data");
    localStorage.clear();
    console.log("localStorage Check", localStorage.getItem("storedData"));
  });
}

document.addEventListener("DOMContentLoaded", async () => mainEvent());
