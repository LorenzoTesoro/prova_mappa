tt.setProductInfo("<your-product-name>", "<your-product-version>");

var map = tt.map({
  key: "dcEQtI4NS1isWSGpD7hptIGNCBFbNbcC",
  container: "map",
  center: [15.4, 53.0],
  zoom: 3,
});

var options = {
  searchOptions: {
    key: "dcEQtI4NS1isWSGpD7hptIGNCBFbNbcC",
    language: "en-GB",
    limit: 5,
  },
  autocompleteOptions: {
    key: "dcEQtI4NS1isWSGpD7hptIGNCBFbNbcC",
    language: "en-GB",
  },
};

var ttSearchBox = new tt.plugins.SearchBox(tt.services, options);
var searchMarkersManager = new SearchMarkersManager(map);
ttSearchBox.on("tomtom.searchbox.resultsfound", handleResultsFound);
ttSearchBox.on("tomtom.searchbox.resultselected", handleResultSelection);
ttSearchBox.on("tomtom.searchbox.resultfocused", handleResultSelection);
ttSearchBox.on("tomtom.searchbox.resultscleared", handleResultClearing);
map.addControl(ttSearchBox, "top-left");

/* event handlers */

/* executes when the search results are found */
function handleResultsFound(event) {
  var results = event.data.results.fuzzySearch.results;

  if (results.length === 0) {
    searchMarkersManager.clear();
  }
  searchMarkersManager.draw(results);
  fitToViewport(results);
}
/* executes if results were found and a user presses arrow up/down or results were found and a user chooses one by clicking on it; */
function handleResultSelection(event) {
  var result = event.data.result;
  if (result.type === "category" || result.type === "brand") {
    return;
  }
  searchMarkersManager.draw([result]);
  fitToViewport(result);
}

function fitToViewport(markerData) {
  if (!markerData || (markerData instanceof Array && !markerData.length)) {
    return;
  }
  var bounds = new tt.LngLatBounds();
  if (markerData instanceof Array) {
    markerData.forEach(function (marker) {
      bounds.extend(getBounds(marker));
    });
  } else {
    bounds.extend(getBounds(markerData));
  }
  map.fitBounds(bounds, { padding: 100, linear: true });
}

function getBounds(data) {
  var btmRight;
  var topLeft;
  if (data.viewport) {
    btmRight = [
      data.viewport.btmRightPoint.lng,
      data.viewport.btmRightPoint.lat,
    ];
    topLeft = [data.viewport.topLeftPoint.lng, data.viewport.topLeftPoint.lat];
  }
  return [btmRight, topLeft];
}
/* executes when a user clicks on "X" button of the SearchBox. */
function handleResultClearing() {
  searchMarkersManager.clear();
}

/* searchMarkersManager */

function SearchMarkersManager(map, options) {
  this.map = map;
  this._options = options || {};
  this._poiList = undefined;
  this.markers = {};
}

SearchMarkersManager.prototype.draw = function (poiList) {
  this._poiList = poiList;
  this.clear();
  this._poiList.forEach(function (poi) {
    var markerId = poi.id;
    var poiOpts = {
      name: poi.poi ? poi.poi.name : undefined,
      address: poi.address ? poi.address.freeformAddress : "",
      distance: poi.dist,
      classification: poi.poi ? poi.poi.classifications[0].code : undefined,
      position: poi.position,
      entryPoints: poi.entryPoints,
    };
    var marker = new SearchMarker(poiOpts, this._options);
    marker.addTo(this.map);
    this.markers[markerId] = marker;
  }, this);
};

SearchMarkersManager.prototype.clear = function () {
  for (var markerId in this.markers) {
    var marker = this.markers[markerId];
    marker.remove();
  }
  this.markers = {};
  this._lastClickedMarker = null;
};

/* SearchMarker */

function SearchMarker(poiData, options) {
  this.poiData = poiData;
  this.options = options || {};
  this.marker = new tt.Marker({
    element: this.createMarker(),
    anchor: "bottom",
  });
  var lon = this.poiData.position.lng || this.poiData.position.lon;
  this.marker.setLngLat([lon, this.poiData.position.lat]);
}

SearchMarker.prototype.addTo = function (map) {
  this.marker.addTo(map);
  this._map = map;
  return this;
};

/* to change marker style */
SearchMarker.prototype.createMarker = function () {
  var elem = document.createElement("div");
  elem.className = "tt-icon-marker-black tt-search-marker";
  if (this.options.markerClassName) {
    elem.className += " " + this.options.markerClassName;
  }
  var innerElem = document.createElement("div");
  innerElem.setAttribute(
    "style",
    "width: 8px; height: 8px; border-radius: 50%; border: 8px solid red;"
  );

  elem.appendChild(innerElem);
  return elem;
};

SearchMarker.prototype.remove = function () {
  this.marker.remove();
  this._map = null;
};
