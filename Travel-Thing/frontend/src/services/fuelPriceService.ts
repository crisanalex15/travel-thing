import axios from "axios";

const API_URL = "http://localhost:5000/api";

export const FUEL_TYPES = {
  BENZINA_STANDARD: "Benzina Standard",
  MOTORINA_STANDARD: "Motorina Standard",
  BENZINA_SUPERIOARA: "Benzina Superioara",
  MOTORINA_PREMIUM: "Motorina Premium",
  GPL: "GPL",
} as const;

export interface FuelPrice {
  id: number;
  city: string;
  fuelType: string;
  price: number;
  lastUpdated: string;
}

export interface AveragePrices {
  [key: string]: number;
}

export const fuelPriceService = {
  async getAllPrices(): Promise<FuelPrice[]> {
    const response = await axios.get(`${API_URL}/FuelPrice`);
    return response.data;
  },

  async getPricesByCity(city: string): Promise<FuelPrice[]> {
    const response = await axios.get(`${API_URL}/FuelPrice/city/${city}`);
    return response.data;
  },

  async getAveragePrices(): Promise<AveragePrices> {
    const response = await axios.get(`${API_URL}/FuelPrice/average`);
    return response.data;
  },

  // Funcție helper pentru a obține prețul mediu pentru un tip specific de combustibil
  async getAveragePriceForType(fuelType: string): Promise<number> {
    const prices = await this.getAveragePrices();
    return prices[fuelType] || 0;
  },
};
