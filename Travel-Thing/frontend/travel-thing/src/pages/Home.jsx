import React, { useState, useEffect } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import "./Home.css";
import { fuelPriceService } from "../services/fuelPriceService";
import AverageFuelPrices from "../components/AverageFuelPrices";
import TravelMap from "../components/map/map";
import Divider from "../components/Divider";

// Importăm imaginile
import cutleryIcon from "../components/Images/cutlery.png";
import cafeIcon from "../components/Images/latte-art.png";
import parkIcon from "../components/Images/park.png";
import museumIcon from "../components/Images/museum.png";
import theaterIcon from "../components/Images/theater.png";
import shopIcon from "../components/Images/store.png";
import churchIcon from "../components/Images/church.png";
import architectureIcon from "../components/Images/architecture.png";
import monumentIcon from "../components/Images/monument.png";
import castleIcon from "../components/Images/castle.png";
import lakeIcon from "../components/Images/lake.png";
import beachIcon from "../components/Images/beach.png";

export default function Home() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [manualPrice, setManualPrice] = useState(false);
  const [fuelType, setFuelType] = useState("Motorina Standard");
  const [routePreference, setRoutePreference] = useState("recommended");
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [averagePrices, setAveragePrices] = useState({});
  const [fuelPrices, setFuelPrices] = useState({});
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [radius, setRadius] = useState("");

  const fuelTypes = [
    "Motorina Premium",
    "Motorina Standard",
    "Benzina Standard",
    "Benzina Superioara",
    "GPL",
    "Electric",
  ];

  const routePreferences = [
    { value: "shortest", label: "Eco", icon: "🌱" },
    { value: "fastest", label: "Normal", icon: "🚗" },
    { value: "recommended", label: "Combinat", icon: "🔄" },
  ];

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        console.log("Se încearcă obținerea prețurilor...");
        const prices = await fuelPriceService.getAveragePrices();
        console.log("Prețuri obținute:", prices);
        setFuelPrices(prices);
        setLoading(false);
      } catch (err) {
        console.error("Eroare detaliată:", err);
        setError(
          "Eroare la încărcarea prețurilor. Vă rugăm să încercați din nou."
        );
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const calculateFuelConsumption = () => {
    if (!routeResult || !consumption || parseFloat(consumption) <= 0) {
      return {
        fuelNeeded: 0,
        totalCost: 0,
        error: "Vă rugăm să introduceți un consum valid",
      };
    }

    const distanceInKm =
      routeResult.distance.kilometers * (isRoundTrip ? 2 : 1);
    const consumptionPerKm = parseFloat(consumption) / 100;
    const totalFuelNeeded = distanceInKm * consumptionPerKm;

    let costPerLiter;
    if (manualPrice) {
      if (!fuelPrice || parseFloat(fuelPrice) <= 0) {
        return {
          fuelNeeded: Math.round(totalFuelNeeded * 100) / 100,
          totalCost: 0,
          error: "Vă rugăm să introduceți un preț valid",
        };
      }
      costPerLiter = parseFloat(fuelPrice);
    } else {
      costPerLiter = fuelPrices[fuelType];
    }

    const totalCost = totalFuelNeeded * costPerLiter;

    return {
      fuelNeeded: Math.round(totalFuelNeeded * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      error: null,
    };
  };

  const normalizeLocation = (location) => {
    if (!location) return "";
    return location
      .trim()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleRoutePreferenceChange = async (preference) => {
    setRoutePreference(preference);
    if (startLocation && endLocation) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          "http://localhost:5283/api/RouteCalculator/calculate",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startLocation: normalizeLocation(startLocation),
              endLocation: normalizeLocation(endLocation),
              preference: preference,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Eroare la calcularea rutei");
        }

        const data = await response.json();
        setRouteResult(data);
      } catch (error) {
        console.error("Eroare:", error);
        setError("Nu s-a putut calcula ruta. Vă rugăm să încercați din nou.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedStart = normalizeLocation(startLocation);
    const normalizedEnd = normalizeLocation(endLocation);

    if (!normalizedStart || !normalizedEnd) {
      setError("Vă rugăm să introduceți ambele locații");
      return;
    }
    if (!consumption || parseFloat(consumption) <= 0) {
      setError("Vă rugăm să introduceți un consum valid");
      return;
    }
    if (manualPrice && (!fuelPrice || parseFloat(fuelPrice) <= 0)) {
      setError("Vă rugăm să introduceți un preț valid");
      return;
    }

    setLoading(true);
    setError(null);
    setRouteResult(null);

    try {
      const response = await fetch(
        "http://localhost:5283/api/RouteCalculator/calculate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            startLocation: normalizedStart,
            endLocation: normalizedEnd,
            preference: routePreference,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Eroare la calcularea rutei");
      }

      const data = await response.json();
      setRouteResult(data);
    } catch (error) {
      console.error("Eroare:", error);
      setError("Nu s-a putut calcula ruta. Vă rugăm să încercați din nou.");
    } finally {
      setLoading(false);
    }
  };

  const consumptionResult = calculateFuelConsumption();

  const formatDuration = (hours, minutes) => {
    const totalMinutes = minutes;
    const formattedHours = Math.floor(totalMinutes / 60);
    const formattedMinutes = totalMinutes % 60;

    if (formattedHours === 0) {
      return `${formattedMinutes} minute`;
    } else if (formattedMinutes === 0) {
      return `${formattedHours} ${formattedHours === 1 ? "oră" : "ore"}`;
    } else {
      return `${formattedHours} ${
        formattedHours === 1 ? "oră" : "ore"
      } și ${formattedMinutes} ${formattedMinutes === 1 ? "minut" : "minute"}`;
    }
  };

  const handleAttractionClick = (attraction) => {
    if (selectedAttraction === attraction) {
      setSelectedAttraction(null);
    } else {
      setSelectedAttraction(attraction);
    }
  };

  return (
    <div className="home-container">
      <h1 className="tt-title">Travel Thing (DEMO)</h1>
      <p className="tt-subtitle">
        Calculator de călătorii și atracții turistice
      </p>
      {loading && <div className="tt-loading">Se încarcă prețurile...</div>}
      {error && <div className="tt-error">{error}</div>}
      <form className="tt-form" onSubmit={handleSubmit}>
        <div className="tt-row">
          <Input
            type="text"
            placeholder="Introdu punctul de plecare..."
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
            onBlur={(e) => setStartLocation(normalizeLocation(e.target.value))}
          />
          <Input
            type="text"
            placeholder="Introdu punctul de sosire..."
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
            onBlur={(e) => setEndLocation(normalizeLocation(e.target.value))}
          />
        </div>
        <div className="tt-row">
          <Input
            type="number"
            placeholder="Introdu consumul mediu (L/100km)"
            value={consumption}
            onChange={(e) => setConsumption(e.target.value)}
          />
          <select
            className="tt-select"
            value={fuelType}
            onChange={(e) => setFuelType(e.target.value)}
          >
            {fuelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="tt-route-preferences">
          {routePreferences.map((pref) => (
            <button
              key={pref.value}
              type="button"
              className={`tt-route-btn ${
                routePreference === pref.value ? "active" : ""
              }`}
              onClick={() => handleRoutePreferenceChange(pref.value)}
            >
              <span className="tt-route-icon">{pref.icon}</span>
              {pref.label}
            </button>
          ))}
        </div>
        <div className="tt-form-group">
          <Button type="button" onClick={() => setManualPrice(!manualPrice)}>
            {manualPrice ? "Preț manual" : "Preț automat"}
          </Button>
          {manualPrice ? (
            <Input
              type="number"
              placeholder="Introdu prețul carburantului (RON/L)"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(e.target.value)}
            />
          ) : (
            <div className="tt-auto-price">
              Preț automat pentru {fuelType}:{" "}
              {fuelPrices[fuelType] || "Se încarcă..."} RON/L
            </div>
          )}
          <div className="tt-form-group-checkbox">
            <p>Include dus-întors</p>
            <input
              type="checkbox"
              checked={isRoundTrip}
              onChange={(e) => setIsRoundTrip(e.target.checked)}
            />
          </div>
        </div>

        <Button type="submit" disabled={loading}>
          {loading ? "Se calculează..." : "Calculează"}
        </Button>
      </form>

      {routeResult && (
        <div className="tt-result">
          <h3>Rezultate ruta:</h3>
          <div className="tt-result-details">
            <p>
              Distanță:{" "}
              {routeResult.distance.kilometers * (isRoundTrip ? 2 : 1)} km
            </p>
            <p>
              Durată:{" "}
              {formatDuration(
                routeResult.duration.hours * (isRoundTrip ? 2 : 1),
                routeResult.duration.minutes * (isRoundTrip ? 2 : 1)
              )}
            </p>
            {consumptionResult.error ? (
              <p className="tt-warning">{consumptionResult.error}</p>
            ) : (
              <>
                <p>Consum carburant: {consumptionResult.fuelNeeded} L</p>
                <p>Cost carburant: {consumptionResult.totalCost} RON</p>
              </>
            )}
          </div>
          <Divider />
          <TravelMap
            geometry={routeResult.geometry}
            startLocation={startLocation}
            endLocation={endLocation}
          />
        </div>
      )}
      <Divider />
      <div className="tt-attractions">
        <h3>Cautare atracții turistice</h3>
        <Input
          type="number"
          className="tt-attractions-form-input"
          placeholder="Raza de cautare (km | ex 0.5)"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
        <div className="tt-attractions-form">
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "restaurants"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("restaurants")}
          >
            <p>Restaurante</p>
            <img src={cutleryIcon} alt="Restaurante" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "cafes"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("cafes")}
          >
            <p>Cafenele</p>
            <img src={cafeIcon} alt="Cafenele" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "parks"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("parks")}
          >
            <p>Parcuri</p>
            <img src={parkIcon} alt="Parcuri" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "museums"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("museums")}
          >
            <p>Muzee</p>
            <img src={museumIcon} alt="Muzee" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "theaters"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("theaters")}
          >
            <p>Teatre și divertisment</p>
            <img src={theaterIcon} alt="Teatre și divertisment" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "shops"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("shops")}
          >
            <p>Magazine</p>
            <img src={shopIcon} alt="Magazine" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "churches"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("churches")}
          >
            <p>Biserici</p>
            <img src={churchIcon} alt="Biserici" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "architecture"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("architecture")}
          >
            <p>Arhitectură</p>
            <img src={architectureIcon} alt="Arhitectură" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "monuments"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("monuments")}
          >
            <p>Monumente</p>
            <img src={monumentIcon} alt="Monumente" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "castles"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("castles")}
          >
            <p>Cetați</p>
            <img src={castleIcon} alt="Cetați" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "lakes"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("lakes")}
          >
            <p>Lacuri</p>
            <img src={lakeIcon} alt="Lacuri" />
          </div>
          <div
            className={`tt-attractions-form-image ${
              selectedAttraction === "beaches"
                ? "selected"
                : selectedAttraction
                ? "disabled"
                : ""
            }`}
            onClick={() => handleAttractionClick("beaches")}
          >
            <p>Plaje</p>
            <img src={beachIcon} alt="Plaje" />
          </div>
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="tt-attractions-form-button"
        >
          {loading ? "Se calculează..." : "Calculează"}
        </Button>
      </div>
    </div>
  );
}
