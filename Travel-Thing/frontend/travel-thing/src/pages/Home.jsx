import React, { useState, useEffect } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import "./Home.css";

export default function Home() {
  const [startLocation, setStartLocation] = useState("");
  const [endLocation, setEndLocation] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [manualPrice, setManualPrice] = useState(false);
  const [fuelType, setFuelType] = useState("Motorina Standard");
  const [routePreference, setRoutePreference] = useState("recommended");
  const [routeResult, setRouteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [averagePrices, setAveragePrices] = useState({});

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

  const fuelPrices = {
    "Motorina Premium": 7.39,
    "Motorina Standard": 6.98,
    "Benzina Standard": 6.86,
    "Benzina Superioara": 7.42,
    GPL: 3.63,
    Electric: 0.5,
  };

  useEffect(() => {
    const fetchAveragePrices = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/fuelprice/average"
        );
        if (!response.ok) {
          throw new Error("Nu s-au putut obține prețurile medii");
        }
        const data = await response.json();
        setAveragePrices(data);
      } catch (error) {
        console.error("Eroare la obținerea prețurilor medii:", error);
      }
    };

    fetchAveragePrices();
  }, []);

  const calculateFuelConsumption = () => {
    if (!routeResult || !consumption || parseFloat(consumption) <= 0) {
      return {
        fuelNeeded: 0,
        totalCost: 0,
        error: "Vă rugăm să introduceți un consum valid",
      };
    }

    const distanceInKm = routeResult.distance.kilometers;
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

  return (
    <div className="home-container">
      <h1 className="tt-title">Travel Thing</h1>
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
            <p>Distanță: {routeResult.distance.kilometers} km</p>
            <p>
              Durată:{" "}
              {formatDuration(
                routeResult.duration.hours,
                routeResult.duration.minutes
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
        </div>
      )}

      <div className="tt-average-prices">
        <h3>Prețuri medii:</h3>
        {Object.entries(averagePrices).map(([fuelType, price]) => (
          <div key={fuelType} className="tt-price-item">
            <span className="tt-price-label">{fuelType}:</span>
            <span className="tt-price-value">{price.toFixed(2)} RON/L</span>
          </div>
        ))}
      </div>
    </div>
  );
}
