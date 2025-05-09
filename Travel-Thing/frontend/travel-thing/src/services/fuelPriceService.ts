import axios from "axios";

const API_URL = "http://localhost:5283/api";

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
    try {
      const response = await axios.get(`${API_URL}/FuelPrice`);
      return response.data;
    } catch (error) {
      console.error("Eroare la obținerea prețurilor:", error);
      throw error;
    }
  },

  async getPricesByCity(city: string): Promise<FuelPrice[]> {
    try {
      const response = await axios.get(`${API_URL}/FuelPrice/city/${city}`);
      return response.data;
    } catch (error) {
      console.error(`Eroare la obținerea prețurilor pentru ${city}:`, error);
      throw error;
    }
  },

  async getAveragePrices(): Promise<AveragePrices> {
    try {
      console.log("Se face request către:", `${API_URL}/FuelPrice/average`);
      const response = await axios.get(`${API_URL}/FuelPrice/average`);
      console.log("Răspuns primit:", response.data);
      return response.data;
    } catch (error) {
      console.error("Eroare la obținerea prețurilor medii:", error);
      throw error;
    }
  },

  async getAveragePriceForType(fuelType: string): Promise<number> {
    try {
      const prices = await this.getAveragePrices();
      return prices[fuelType] || 0;
    } catch (error) {
      console.error(
        `Eroare la obținerea prețului mediu pentru ${fuelType}:`,
        error
      );
      throw error;
    }
  },

  async getLastUpdate(): Promise<Date> {
    try {
      const response = await axios.get(`${API_URL}/FuelPrice/last-update`);
      return new Date(response.data);
    } catch (error) {
      console.error("Eroare la obținerea datei ultimei actualizări:", error);
      throw error;
    }
  },
};
