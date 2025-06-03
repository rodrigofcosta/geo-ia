// script.js completo com suporte a KML, KMZ, CSV, XLSX

const map = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

let layers = [];

function sendPrompt() {
  const prompt = document.getElementById("promptInput").value;
  const responseArea = document.getElementById("responseArea");
  responseArea.innerText = "IA respondendo: " + prompt;
}

function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  if (!file) return alert("Selecione um arquivo primeiro.");

  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'kml' || ext === 'kmz') handleKML(file);
  else if (ext === 'csv') handleCSV(file);
  else if (ext === 'xlsx') handleExcel(file);
  else alert("Formato não suportado. Use KML, KMZ, CSV ou XLSX.");
}

function handleKML(file) {
  const reader = new FileReader();

  if (file.name.toLowerCase().endsWith(".kmz")) {
    reader.onload = async function (e) {
      try {
        const zip = await JSZip.loadAsync(e.target.result);
        const kmlFile = Object.values(zip.files).find(f => f.name.endsWith(".kml"));
        if (!kmlFile) return alert("KMZ não contém KML válido.");
        const kmlText = await kmlFile.async("text");
        handleKMLContent(kmlText, file.name);
      } catch (err) {
        alert("Erro ao processar KMZ.");
        console.error("Erro no KMZ:", err);
      }
    };
    reader.readAsArrayBuffer(file);
  } else {
    reader.onload = function (e) {
      try {
        handleKMLContent(e.target.result, file.name);
      } catch (err) {
        alert("Erro ao processar KML.");
        console.error("Erro no KML:", err);
      }
    };
    reader.readAsText(file);
  }
}

function handleKMLContent(kmlContent, fileName = "KML") {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(kmlContent, "text/xml");
  const geojson = { type: "FeatureCollection", features: [] };

  const placemarks = xmlDoc.getElementsByTagName("Placemark");
  for (let i = 0; i < placemarks.length; i++) {
    try {
      const placemark = placemarks[i];
      const name = placemark.getElementsByTagName("name")[0]?.textContent || "Sem nome";
      let geometry = null;

      const point = placemark.querySelector("Point");
      const lineString = placemark.querySelector("LineString");
      const polygon = placemark.querySelector("Polygon");

      if (point) {
        const coords = point.querySelector("coordinates")?.textContent?.trim();
        if (coords) {
          const [lon, lat] = coords.split(",").map(Number);
          geometry = { type: "Point", coordinates: [lon, lat] };
        }
      } else if (lineString) {
        const coordsText = lineString.querySelector("coordinates")?.textContent?.trim();
        if (coordsText) {
          const coords = coordsText.split(/\s+/).map(c => c.split(",").map(Number)).filter(c => c.length >= 2);
          geometry = { type: "LineString", coordinates: coords.map(([lon, lat]) => [lon, lat]) };
        }
      } else if (polygon) {
        const coordsText = polygon.querySelector("outerBoundaryIs coordinates")?.textContent?.trim()
                          || polygon.querySelector("coordinates")?.textContent?.trim();
        if (coordsText) {
          const coords = coordsText.split(/\s+/).map(c => c.split(",").map(Number)).filter(c => c.length >= 2);
          geometry = { type: "Polygon", coordinates: [coords.map(([lon, lat]) => [lon, lat])] };
        }
      }

      if (geometry) {
        geojson.features.push({ type: "Feature", properties: { name }, geometry });
      }
    } catch (err) {
      console.warn("Erro em Placemark:", err);
    }
  }

  if (geojson.features.length > 0) {
    const layer = L.geoJSON(geojson).addTo(map);
    addLayerToUI(layer, fileName);
    alert("Arquivo KML carregado com sucesso!");
  } else {
    alert("Nenhuma feição válida encontrada no arquivo.");
  }
}

function handleCSV(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const lines = e.target.result.trim().split('\n');
      const headers = lines[0].split(',');
      const data = lines.slice(1).map(l => l.split(','));
      const geojson = { type: "FeatureCollection", features: [] };

      for (const row of data) {
        let lat = null, lon = null;
        for (let j = 0; j < headers.length; j++) {
          const h = headers[j].toLowerCase();
          if (h.includes('lat')) lat = parseFloat(row[j]);
          if (h.includes('lon') || h.includes('lng')) lon = parseFloat(row[j]);
        }
        if (lat !== null && lon !== null) {
          geojson.features.push({ type: "Feature", geometry: { type: "Point", coordinates: [lon, lat] }, properties: {} });
        }
      }

      const layer = L.geoJSON(geojson).addTo(map);
      addLayerToUI(layer, file.name);
      alert("Arquivo CSV carregado com sucesso!");
    } catch (err) {
      alert("Erro ao carregar CSV.");
      console.error(err);
    }
  };
  reader.readAsText(file);
}

function handleExcel(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const workbook = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const headers = json[0];
      const rows = json.slice(1);

      const geojson = { type: "FeatureCollection", features: [] };
      for (const row of rows) {
        let lat = null, lon = null;
        for (let j = 0; j < headers.length; j++) {
          const h = headers[j]?.toLowerCase();
          if (h?.includes('lat')) lat = parseFloat(row[j]);
          if (h?.includes('lon') || h?.includes('lng')) lon = parseFloat(row[j]);
        }
        if (lat !== null && lon !== null) {
          geojson.features.push({ type: "Feature", geometry: { type: "Point", coordinates: [lon, lat] }, properties: {} });
        }
      }

      const layer = L.geoJSON(geojson).addTo(map);
      addLayerToUI(layer, file.name);
      alert("Arquivo Excel carregado com sucesso!");
    } catch (err) {
      alert("Erro ao carregar Excel.");
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function addLayerToUI(layer, name) {
  const container = document.getElementById('layerList');
  const item = document.createElement('div');
  item.className = 'layer-item';
  item.dataset.name = name;
  item.innerHTML = `<span>${name}</span> <button onclick="toggleLayer('${name}')">Mostrar/Esconder</button>`;
  container.appendChild(item);
  layers.push({ name, layer });
}

function toggleLayer(name) {
  const layer = layers.find(l => l.name === name)?.layer;
  if (layer) {
    if (map.hasLayer(layer)) map.removeLayer(layer);
    else map.addLayer(layer);
  }
}
