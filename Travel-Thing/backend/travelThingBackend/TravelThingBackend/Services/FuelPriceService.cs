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
            _logger.LogInformation("Începe actualizarea prețurilor combustibilului");

            // Verifică dacă s-a făcut deja o actualizare astăzi
            var lastUpdate = await _context.FuelPrices
                .OrderByDescending(p => p.LastUpdated)
                .Select(p => p.LastUpdated)
                .FirstOrDefaultAsync();

            if (lastUpdate != null && lastUpdate.Date == DateTime.UtcNow.Date)
            {
                _logger.LogInformation("Prețurile au fost deja actualizate astăzi");
                return;
            }

            // Șterge toate prețurile vechi
            _context.FuelPrices.RemoveRange(_context.FuelPrices);
            await _context.SaveChangesAsync();
            _logger.LogInformation("Prețurile vechi au fost șterse");

            var cities = City.AllCities;
            var fuelTypes = new[] { "Benzina_Regular", "Motorina_Regular", "GPL", "Benzina_Premium", "Motorina_Premium" };

            foreach (var city in cities)
            {
                try
                {
                    _logger.LogInformation("Încep procesarea pentru orașul {City}", city);
                    var client = _httpClientFactory.CreateClient();
                    var url = "https://www.peco-online.ro/index.php";

                    foreach (var fuelType in fuelTypes)
                    {
                        _logger.LogInformation("Procesez {FuelType} pentru {City}", fuelType, city);
                        var formData = new Dictionary<string, string>
                        {
                            { "carburant", fuelType },
                            { "locatie", "Judet" },
                            { "nume_locatie", city },
                            { "Submit", "Cauta" },
                            { "retea[]", "Petrom" }
                        };

                        var content = new FormUrlEncodedContent(formData);
                        var response = await client.PostAsync(url, content);
                        var html = await response.Content.ReadAsStringAsync();

                        // Parse HTML response to get price
                        var price = ParsePriceFromHtml(html);
                        _logger.LogInformation("Preț găsit pentru {City} - {FuelType}: {Price}", city, fuelType, price);
                        
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
                _logger.LogInformation("Am găsit {Count} rânduri în tabel", rows.Count);
                foreach (var row in rows)
                {
                    var cells = row.SelectNodes("td");
                    if (cells != null && cells.Count >= 2)
                    {
                        var priceText = cells[0].InnerText.Trim();
                        _logger.LogInformation("Text preț găsit: {PriceText}", priceText);
                        if (decimal.TryParse(priceText.Replace(",", "."), out var price))
                        {
                            _logger.LogInformation("Preț parsat: {Price}", price);
                            if ((price > 3 && price < 15) || (price > 1 && price < 8 && priceText.Contains("GPL")))
                            {
                                _logger.LogInformation("Preț valid găsit: {Price}", price);
                                return price;
                            }
                            else
                            {
                                _logger.LogInformation("Preț în afara intervalului valid: {Price}", price);
                            }
                        }
                        else
                        {
                            _logger.LogWarning("Nu s-a putut parsa prețul din text: {PriceText}", priceText);
                        }
                    }
                }
            }
            else
            {
                _logger.LogWarning("Nu s-au găsit rânduri în tabel");
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