using Microsoft.EntityFrameworkCore;
using TravelThingBackend.Data;
using TravelThingBackend.Models;
using System.Net.Http;
using System.Text.Json;
using System.Text;

namespace TravelThingBackend.Services
{
    public class FuelPriceService
    {
        private readonly ApplicationDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<FuelPriceService> _logger;

        public FuelPriceService(
            ApplicationDbContext context,
            IHttpClientFactory httpClientFactory,
            ILogger<FuelPriceService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task UpdateFuelPricesAsync()
        {
            var cities = City.AllCities;
            var fuelTypes = new[] { "Benzina_Regular", "Motorina_Regular", "GPL", "Benzina_Premium", "Motorina_Premium" };

            foreach (var city in cities)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    var url = "https://www.peco-online.ro/index.php";

                    foreach (var fuelType in fuelTypes)
                    {
                        var formData = new Dictionary<string, string>
                        {
                            { "carburant", fuelType },
                            { "locatie", "Oras" },
                            { "nume_locatie", city },
                            { "Submit", "Cauta" },
                            { "retea[]", "Petrom" }
                        };

                        var content = new FormUrlEncodedContent(formData);
                        var response = await client.PostAsync(url, content);
                        var html = await response.Content.ReadAsStringAsync();

                        // Parse HTML response to get price
                        var price = ParsePriceFromHtml(html);
                        if (price > 0)
                        {
                            var fuelPrice = new FuelPrice
                            {
                                City = city,
                                FuelType = MapFuelType(fuelType),
                                Price = price,
                                LastUpdated = DateTime.UtcNow.AddHours(3)
                            };

                            var existingPrice = await _context.FuelPrices
                                .FirstOrDefaultAsync(p => p.City == city && p.FuelType == fuelPrice.FuelType);

                            if (existingPrice != null)
                            {
                                existingPrice.Price = price;
                                existingPrice.LastUpdated = DateTime.UtcNow.AddHours(3);
                            }
                            else
                            {
                                _context.FuelPrices.Add(fuelPrice);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching prices for {City}", city);
                }
            }

            await _context.SaveChangesAsync();
        }

        private decimal ParsePriceFromHtml(string html)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            doc.LoadHtml(html);

            var rows = doc.DocumentNode.SelectNodes("//table//tr");
            if (rows != null)
            {
                foreach (var row in rows)
                {
                    var cells = row.SelectNodes("td");
                    if (cells != null && cells.Count >= 2)
                    {
                        var priceText = cells[0].InnerText.Trim();
                        if (decimal.TryParse(priceText.Replace(",", "."), out var price))
                        {
                            if ((price > 5 && price < 15) || (price > 2 && price < 5 && priceText.Contains("GPL")))
                                return price;
                        }
                    }
                }
            }
            return 0;
        }

        private string MapFuelType(string pecoFuelType)
        {
            return pecoFuelType switch
            {
                "Benzina_Regular" => "Benzina Standard",
                "Motorina_Regular" => "Motorina Standard",
                "GPL" => "GPL",
                "Benzina_Premium" => "Benzina Superioara",
                "Motorina_Premium" => "Motorina Premium",
                _ => pecoFuelType
            };
        }
    }
} 