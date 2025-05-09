import * as React from "react";
import { useEffect, useState } from "react";
import {
  fuelPriceService,
  AveragePrices,
  FUEL_TYPES,
} from "../services/fuelPriceService";
import "./AverageFuelPrices.css";

function AverageFuelPrices() {
  const [averagePrices, setAveragePrices] = useState<AveragePrices>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rawData, setRawData] = useState<string>("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prices, updateTime] = await Promise.all([
          fuelPriceService.getAveragePrices(),
          fuelPriceService.getLastUpdate(),
        ]);
        setAveragePrices(prices);
        setLastUpdate(updateTime);
        setRawData(JSON.stringify(prices, null, 2));
        setLoading(false);
      } catch (err) {
        setError("Eroare la încărcarea prețurilor medii");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Se încarcă...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="average-prices">
      <h2>Prețuri Medii Combustibil</h2>
      {lastUpdate && (
        <p className="last-update">
          Ultima actualizare:{" "}
          {lastUpdate.toLocaleDateString("ro-RO", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      )}
      <div className="prices-grid">
        {Object.values(FUEL_TYPES).map((fuelType) => (
          <div key={fuelType} className="price-card">
            <h3>{fuelType}</h3>
            <p className="price">{averagePrices[fuelType] || "0.00"} RON</p>
          </div>
        ))}
      </div>
      <div className="raw-data">
        <h3>Date brute de la backend:</h3>
        <pre>{rawData}</pre>
      </div>
    </div>
  );
}

export default AverageFuelPrices;
