import React, { useState } from "react";
import Button from "../components/Button";
import Input from "../components/Input";
import "./Home.css";

export default function Home() {
  const [destination, setDestination] = useState("");
  const [consumption, setConsumption] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [manualPrice, setManualPrice] = useState(false);

  return (
    <div className="home-container">
      <h1 className="tt-title">Travel Thing</h1>
      <p className="tt-subtitle">
        Calculator de călătorii și atracții turistice
      </p>
      <form className="tt-form">
        <div className="tt-row">
          <Input
            type="text"
            placeholder="Introdu punctul de plecare..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Introdu punctul de sosire..."
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
        </div>
        <div>
          <Input
            type="number"
            placeholder="Introdu consumul mediu"
            value={consumption}
            onChange={(e) => setConsumption(e.target.value)}
          />
        </div>
        <div className="tt-form-group">
          <Button type="button" onClick={() => setManualPrice(!manualPrice)}>
            {manualPrice ? "Autopreț" : "Preț manual"}
          </Button>
          {manualPrice && (
            <Input
              type="number"
              placeholder="Introdu prețul carburantului"
              value={fuelPrice}
              onChange={(e) => setFuelPrice(e.target.value)}
            />
          )}
        </div>
        <Button type="submit">Calculează</Button>
      </form>
    </div>
  );
}
