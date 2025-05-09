import { useState } from "react";
import {
  fuelPriceService,
  AveragePrices,
  FUEL_TYPES,
} from "../services/fuelPriceService";
import "./AverageFuelPrices.css";
import { useEffect } from "react";
import React from "react";

const AverageFuelPrices = () => {
  const [averagePrices, setAveragePrices] = useState<AveragePrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAveragePrices = async () => {
      try {
        const prices = await fuelPriceService.getAveragePrices();
        setAveragePrices(prices);
        setLoading(false);
      } catch (err) {
        setError("Eroare la încărcarea prețurilor medii");
        setLoading(false);
      }
    };

    fetchAveragePrices();
  }, []);

  if (loading) return <div>Se încarcă...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="average-prices">
      <h2>Prețuri Medii Combustibil</h2>
      <div className="prices-grid">
        {Object.values(FUEL_TYPES).map((fuelType) => (
          <div key={fuelType} className="price-card">
            <h3>{fuelType}</h3>
            <p className="price">
              {averagePrices[fuelType]?.toFixed(2) || "0.00"} RON
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AverageFuelPrices;
