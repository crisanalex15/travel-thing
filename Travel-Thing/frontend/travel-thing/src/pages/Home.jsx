import React, { useState, useEffect } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import "./Home.css";
import { fuelPriceService } from "../services/fuelPriceService";
import AverageFuelPrices from "../components/AverageFuelPrices";
import TravelMap from "../components/map/map";
import Divider from "../components/Divider";

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
              startLocation: startLocation,
              endLocation: endLocation,
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
    if (!startLocation || !endLocation) {
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
            startLocation: startLocation,
            endLocation: endLocation,
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

  if (loading) return <div>Se încarcă...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="home-container">
      <h1 className="tt-title">Travel Thing (DEMO)</h1>
      <p className="tt-subtitle">
        Calculator de călătorii și atracții turistice
      </p>
      <form className="tt-form" onSubmit={handleSubmit}>
        <div className="tt-row">
          <Input
            type="text"
            placeholder="Introdu punctul de plecare..."
            value={startLocation}
            onChange={(e) => setStartLocation(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Introdu punctul de sosire..."
            value={endLocation}
            onChange={(e) => setEndLocation(e.target.value)}
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
              Preț automat pentru {fuelType}: {fuelPrices[fuelType]} RON/L
            </div>
          )}
          <div className="tt-form-group-checkbox ">
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

      {error && <div className="tt-error">{error}</div>}

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
    </div>
  );
}
