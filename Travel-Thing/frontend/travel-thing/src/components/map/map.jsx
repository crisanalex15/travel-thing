import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { decode } from "@mapbox/polyline";
import "./CustomMap.css";

// Fix default marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "custom-marker",
});

L.Marker.prototype.options.icon = DefaultIcon;

// Funcție pentru calcularea zoom-ului în funcție de distanță
const calculateZoom = (coordinates) => {
  if (!coordinates || coordinates.length < 2) return 8;

  // Calculăm distanța în grade între punctele extreme
  const latDiff = Math.abs(
    coordinates[0][0] - coordinates[coordinates.length - 1][0]
  );
  const lonDiff = Math.abs(
    coordinates[0][1] - coordinates[coordinates.length - 1][1]
  );
  const maxDiff = Math.max(latDiff, lonDiff);

  // Mapăm distanța la un nivel de zoom potrivit
  if (maxDiff > 15) return 2; // Pentru distanțe intercontinentale
  if (maxDiff > 10) return 3; // Pentru distanțe între țări mari
  if (maxDiff > 7) return 4; // Pentru distanțe între țări mici
  if (maxDiff > 4) return 5; // Pentru distanțe între regiuni mari
  if (maxDiff > 2) return 6; // Pentru distanțe între regiuni mici
  if (maxDiff > 1) return 7; // Pentru distanțe între orașe mari
  if (maxDiff > 0.5) return 8; // Pentru distanțe între orașe mici
  if (maxDiff > 0.2) return 9; // Pentru distanțe între cartiere
  if (maxDiff > 0.1) return 10; // Pentru distanțe între străzi
  return 13; // Pentru distanțe foarte mici (în aceeași zonă)
};

export default function TravelMap({ geometry, startLocation, endLocation }) {
  // Decode polyline to coordinates
  const coordinates = geometry
    ? decode(geometry).map((coord) => [coord[0], coord[1]])
    : [];

  // Calculate center point between start and end locations
  const center =
    coordinates.length > 0
      ? [
          (coordinates[0][0] + coordinates[coordinates.length - 1][0]) / 2,
          (coordinates[0][1] + coordinates[coordinates.length - 1][1]) / 2,
        ]
      : [45.967, 25.26]; // Default center if no coordinates

  // Calculăm zoom-ul în funcție de coordonate
  const zoom = calculateZoom(coordinates);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={true}
      style={{
        height: "400px",
        width: "100%",
        border: "3px solid #4caf50",
        borderRadius: "16px",
        boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
        overflow: "hidden",
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {coordinates.length > 0 && (
        <>
          <Marker position={coordinates[0]}>
            <Popup>{startLocation || "Punct de plecare"}</Popup>
          </Marker>
          <Marker
            position={coordinates[coordinates.length - 1]}
            className="end-marker"
          >
            <Popup>{endLocation || "Punct de sosire"}</Popup>
          </Marker>
          <Polyline
            positions={coordinates}
            color="#4caf50"
            weight={3}
            opacity={0.7}
          />
        </>
      )}
    </MapContainer>
  );
}
