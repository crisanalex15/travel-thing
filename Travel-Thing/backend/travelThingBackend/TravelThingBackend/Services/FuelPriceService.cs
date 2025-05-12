using Microsoft.EntityFrameworkCore;
using TravelThingBackend.Data;
using TravelThingBackend.Models;
using System.Net.Http;
using System.Text.Json;
using System.Text;
using HtmlAgilityPack;

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

            var cities = City.AllCities;
            var fuelTypes = new[] { "Benzina_Regular", "Motorina_Regular", "GPL", "Benzina_Premium", "Motorina_Premium" };
            var newPrices = new List<FuelPrice>();
            var totalRequests = cities.Length * fuelTypes.Length;
            var successfulRequests = 0;

            foreach (var city in cities)
            {
                try
                {
                    _logger.LogInformation("Încep procesarea pentru orașul {City}", city);
                    var client = _httpClientFactory.CreateClient();
                    
                    // Adăugăm headere pentru a simula un browser real
                    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36");
                    client.DefaultRequestHeaders.Add("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8");
                    client.DefaultRequestHeaders.Add("Accept-Language", "en-US,en;q=0.5");
                    client.DefaultRequestHeaders.Add("Connection", "keep-alive");
                    client.DefaultRequestHeaders.Add("Upgrade-Insecure-Requests", "1");
                    
                    var url = "https://www.peco-online.ro/index.php";

                    foreach (var fuelType in fuelTypes)
                    {
                        _logger.LogInformation("Procesez {FuelType} pentru {City}", fuelType, city);
                        
                        // Folosim List<KeyValuePair> în loc de Dictionary pentru a permite chei duplicate
                        var formData = new List<KeyValuePair<string, string>>
                        {
                            new KeyValuePair<string, string>("carburant", fuelType),
                            new KeyValuePair<string, string>("locatie", "Judet"),
                            new KeyValuePair<string, string>("nume_locatie", city),
                            new KeyValuePair<string, string>("Submit", "Cauta")
                        };

                        // Adăugăm toate rețelele de benzinării
                        var networks = new[] { "Petrom", "OMV", "Rompetrol", "Lukoil", "Mol", "Socar", "Gazprom" };
                        foreach (var network in networks)
                        {
                            formData.Add(new KeyValuePair<string, string>("retele[]", network));
                        }

                        var content = new FormUrlEncodedContent(formData);
                        
                        // Adăugăm header pentru Content-Type
                        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-www-form-urlencoded");
                        
                        var response = await client.PostAsync(url, content);
                        var html = await response.Content.ReadAsStringAsync();
                        
                        // Salvăm HTML-ul pentru debugging
                        _logger.LogInformation("Răspuns HTML pentru {City} - {FuelType}: {Html}", city, fuelType, html);

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
                            newPrices.Add(fuelPrice);
                            successfulRequests++;
                        }
                        else
                        {
                            _logger.LogWarning("Nu s-a putut obține prețul pentru {City} - {FuelType}", city, fuelType);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error fetching prices for {City}", city);
                }
            }

            // Actualizăm baza de date dacă am obținut cel puțin 50% din prețuri
            if (successfulRequests >= totalRequests * 0.5 && newPrices.Any())
            {
                // Șterge toate prețurile vechi
                _context.FuelPrices.RemoveRange(_context.FuelPrices);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Prețurile vechi au fost șterse");

                // Adaugă prețurile noi
                await _context.FuelPrices.AddRangeAsync(newPrices);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Prețurile noi au fost adăugate. {Successful}/{Total} prețuri actualizate cu succes.", 
                    successfulRequests, totalRequests);
            }
            else
            {
                _logger.LogWarning("Nu s-au putut obține suficiente prețuri. {Successful}/{Total} prețuri actualizate cu succes.", 
                    successfulRequests, totalRequests);
                throw new Exception($"Nu s-au putut obține suficiente prețuri. {successfulRequests}/{totalRequests} prețuri actualizate cu succes.");
            }
        }

        private decimal ParsePriceFromHtml(string html)
        {
            var doc = new HtmlAgilityPack.HtmlDocument();
            doc.LoadHtml(html);

            // Căutăm toate prețurile din rezultate
            var priceNodes = doc.DocumentNode.SelectNodes("//h5[contains(@class, 'pret')]/strong");
            if (priceNodes != null && priceNodes.Any())
            {
                // Luăm cel mai mic preț (cel mai avantajos)
                decimal minPrice = decimal.MaxValue;
                foreach (var node in priceNodes)
                {
                    var priceText = node.InnerText.Trim();
                    _logger.LogInformation("Text preț găsit: {PriceText}", priceText);
                    
                    if (decimal.TryParse(priceText.Replace(",", "."), out var price))
                    {
                        _logger.LogInformation("Preț parsat: {Price}", price);
                        if ((price > 3 && price < 15) || (price > 1 && price < 8 && priceText.Contains("GPL")))
                        {
                            if (price < minPrice)
                            {
                                minPrice = price;
                            }
                        }
                    }
                }

                if (minPrice != decimal.MaxValue)
                {
                    _logger.LogInformation("Cel mai mic preț găsit: {Price}", minPrice);
                    return minPrice;
                }
            }
            
            _logger.LogWarning("Nu s-au găsit prețuri în rezultate");
            _logger.LogInformation("HTML primit: {Html}", html);
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