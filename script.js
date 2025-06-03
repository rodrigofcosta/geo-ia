// Inicializa o mapa
const map = L.map('map').setView([0, 0], 2);

// Adiciona uma camada base (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',  {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Função para carregar arquivo
function uploadFile() {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um arquivo primeiro.");
    return;
  }

  const reader = new FileReader();

  reader.onload = function(e) {
    const content = e.target.result;

    // Tratamento de diferentes formatos
    if (file.name.endsWith('.kml') || file.name.endsWith('.kmz')) {
      handleKML(content);
    } else if (file.name.endsWith('.csv')) {
      handleCSV(content);
    } else if (file.name.endsWith('.xlsx')) {
      handleExcel(content);
    } else {
      alert("Formato não suportado.");
    }
  };

  reader.readAsText(file);
}

// Função para tratar KML/KMZ
function handleKML(kmlContent) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(kmlContent, "text/xml");

    const geojson = {
      type: "FeatureCollection",
      features: []
    };

    const placemarks = xmlDoc.getElementsByTagName("Placemark");

    for (let i = 0; i < placemarks.length; i++) {
      const placemark = placemarks[i];
      const name = placemark.getElementsByTagName("name")[0]?.textContent || "Sem nome";

      let geometry = null;

      const point = placemark.querySelector("Point");
      const lineString = placemark.querySelector("LineString");
      const polygon = placemark.querySelector("Polygon");

      if (point) {
        const coords = point.querySelector("coordinates")?.textContent;
        if (coords) {
          const [lon, lat] = coords.split(',').map(Number);
          geometry = {
            type: "Point",
            coordinates: [lon, lat]
          };
        }
      } else if (lineString) {
        const coords = lineString.querySelector("coordinates")?.textContent;
        if (coords) {
          const points = coords.split(' ').map(c => c.split(',').map(Number));
          geometry = {
            type: "LineString",
            coordinates: points
          };
        }
      } else if (polygon) {
        const coords = polygon.querySelector("coordinates")?.textContent;
        if (coords) {
          const points = coords.split(' ').map(c => c.split(',').map(Number));
          geometry = {
            type: "Polygon",
            coordinates: [points]
          };
        }
      }

      if (geometry) {
        geojson.features.push({
          type: "Feature",
          properties: { name },
          geometry: geometry
        });
      }
    }

    const layer = L.geoJSON(geojson).addTo(map);
    alert("Arquivo KML carregado!");
  } catch (error) {
    alert("Erro ao carregar o arquivo KML.\n\nVerifique se o arquivo está no formato correto.");
    console.error(error);
  }
}

// Função para tratar CSV
function handleCSV(csvContent) {
  try {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = lines.slice(1).map(line => line.split(','));

    const geojson = {
      type: "FeatureCollection",
      features: []
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      let lat = null, lon = null;

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toLowerCase();
        const value = row[j];

        if (header.includes('lat') || header.includes('latitude')) {
          lat = parseFloat(value);
        } else if (header.includes('lon') || header.includes('longitude') || header.includes('lng')) {
          lon = parseFloat(value);
        }
      }

      if (lat !== null && lon !== null) {
        geojson.features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [lon, lat]
          }
        });
      }
    }

    const layer = L.geoJSON(geojson).addTo(map);
    alert("Arquivo CSV carregado!");
  } catch (error) {
    alert("Erro ao carregar o arquivo CSV.\n\nVerifique se o formato está correto.");
    console.error(error);
  }
}

// Função para tratar Excel (via SheetJS)
function handleExcel(xlsxContent) {
  try {
    const workbook = XLSX.read(xlsxContent, { type: 'binary' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

    const geojson = {
      type: "FeatureCollection",
      features: []
    };

    const headers = data[0];
    const rows = data.slice(1);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      let lat = null, lon = null;

      for (let j = 0; j < headers.length; j++) {
        const header = headers[j].toLowerCase();
        const value = row[j];

        if (header.includes('lat') || header.includes('latitude')) {
          lat = parseFloat(value);
        } else if (header.includes('lon') || header.includes('longitude') || header.includes('lng')) {
          lon = parseFloat(value);
        }
      }

      if (lat !== null && lon !== null) {
        geojson.features.push({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Point",
            coordinates: [lon, lat]
          }
        });
      }
    }

    const layer = L.geoJSON(geojson).addTo(map);
    alert("Arquivo Excel carregado!");
  } catch (error) {
    alert("Erro ao carregar o arquivo Excel.\n\nVerifique se o formato está correto.");
    console.error(error);
  }
}

// Função para enviar prompt à IA (simulação)
function sendPrompt() {
  const prompt = document.getElementById("promptInput").value;
  const responseArea = document.getElementById("responseArea");
  responseArea.innerText = "IA respondendo: " + prompt;
}