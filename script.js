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
    const str = `<li>${item.location}</li>`;
    target.innerHTML += str;
  });
}

function filterList(list, query) {
  return list.filter((item) => {
    const lowerCaseName = item.location.toLowerCase();
    const lowerCaseQuery = query.toLowerCase();
    return lowerCaseName.includes(lowerCaseQuery);
  });
}

function cutRestaurantList(list) {
  console.log("fired cut list");
  const range = [...Array(10).keys()];
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
    L.marker([item.latitude, item.longitude]).addTo(map).bindPopup(title=item.location);
    
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
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "# In Each Borough",
          data: info,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

function changeChart(chart, dataObject){
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
  if (!Array.isArray(array)) {
    return {};
  }
  return array.reduce((collection, item) => {
    if (!collection[item.boroname]) {
      collection[item.boroname] = [item];
    } else {
      collection[item.boroname].push(item);
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
  //generateListButton.classList.add("hidden");

  const carto = initMap();

  const storedData = localStorage.getItem("storedData");

  let parsedData = JSON.parse(storedData);
  if (parsedData?.length > 0) {
    generateListButton.classList.remove("hidden");
  }


  let currentList = [];
/*
  loadDataButton.addEventListener("click", async (submitEvent) => {
    console.log("Loading data");
    loadAnimation.style.display = "inline-block";

    const results = await fetch(
      "https://data.cityofnewyork.us/resource/yjub-udmw.json"
    );

    const storedList = await results.json();
    localStorage.setItem("storedData", JSON.stringify(storedList));
    parsedData = storedList;

    if (parsedData?.length > 0) {
      generateListButton.classList.remove("hidden");
    }

    loadAnimation.style.display = "none";
  });*/

  const results = await fetch(
    "https://data.cityofnewyork.us/resource/yjub-udmw.json"
  );

  const storedList = await results.json();
  localStorage.setItem("storedData", JSON.stringify(storedList));
  parsedData = storedList;

  const shapedData = shapeDataForLineChart(parsedData);
  const myChart = initChart(chartTarget, shapedData);

  generateListButton.addEventListener("click", (event) => {
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
}

document.addEventListener("DOMContentLoaded", async () => mainEvent());