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

    console.log("Conteúdo do XML:", xmlDoc); // Mostra o XML no console

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

    if (geojson.features.length === 0) {
      alert("Arquivo KML vazio ou sem geometrias válidas.");
      return;
    }

    const layer = L.geoJSON(geojson).addTo(map);
    alert("Arquivo KML carregado com sucesso!");
  } catch (error) {
    alert("Erro ao carregar o arquivo KML.\n\nVerifique se o arquivo está no formato correto.");
    console.error("Erro detalhado:", error);
  }
}