/*5ae2e3f221c38a28845f05b669b15222856ba95debb9052a3c22159a*/
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System;
using Newtonsoft.Json;

[ApiController]
[Route("api/[controller]")]
public class TouristAttractionsController : ControllerBase
{
    private readonly ILogger<TouristAttractionsController> _logger;
    private readonly HttpClient _httpClient;
    private const string ApiKey = "5ae2e3f221c38a28845f05b669b15222856ba95debb9052a3c22159a"; // înlocuiește cu cheia ta
    private const string BaseUrl = "https://api.opentripmap.com/0.1/en/places";
    private const string GoogleApiKey = "YOUR_GOOGLE_API_KEY"; // Înlocuiește cu cheia ta

    public TouristAttractionsController(HttpClient httpClient, ILogger<TouristAttractionsController> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371; // Raza Pământului în kilometri
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double angle)
    {
        return Math.PI * angle / 180.0;
    }

    private async Task<string> GetGooglePlaceImage(string placeName, double lat, double lon)
    {
        try
        {
            // Căutăm locația în Google Places
            var searchUrl = $"https://maps.googleapis.com/maps/api/place/textsearch/json?query={Uri.EscapeDataString(placeName)}&location={lat},{lon}&radius=1000&key={GoogleApiKey}";
            var searchResponse = await _httpClient.GetAsync(searchUrl);
            
            if (!searchResponse.IsSuccessStatusCode)
                return "https://via.placeholder.com/300x200?text=No+Image+Available";

            var searchJson = await searchResponse.Content.ReadAsStringAsync();
            var searchData = JsonDocument.Parse(searchJson).RootElement;

            if (searchData.TryGetProperty("results", out var results) && results.ValueKind == JsonValueKind.Array)
            {
                foreach (var result in results.EnumerateArray())
                {
                    if (result.TryGetProperty("photos", out var photos) && photos.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var photo in photos.EnumerateArray())
                        {
                            if (photo.TryGetProperty("photo_reference", out var photoRef))
                            {
                                var photoReference = photoRef.GetString();
                                return $"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference={photoReference}&key={GoogleApiKey}";
                            }
                        }
                    }
                }
            }
        }
        catch (Exception)
        {
            // În caz de eroare, returnăm imaginea placeholder
        }

        return "https://via.placeholder.com/300x200?text=No+Image+Available";
    }

    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyAttractions(
        double lat,
        double lon,
        int radius = 10000,
        string kinds = "interesting_places")
    {
        var url = $"{BaseUrl}/radius?radius={radius}&lon={lon}&lat={lat}&kinds={kinds}&format=json&apikey={ApiKey}";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Eroare la apelarea OpenTripMap");

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(json).RootElement;
        
        var results = new List<object>();

        if (data.ValueKind == JsonValueKind.Array)
        {
            foreach (var feature in data.EnumerateArray())
            {
                try
                {
                    var xid = feature.GetProperty("xid").GetString();
                    var detailsUrl = $"{BaseUrl}/xid/{xid}?apikey={ApiKey}";
                    var detailsResponse = await _httpClient.GetAsync(detailsUrl);

                    if (!detailsResponse.IsSuccessStatusCode)
                        continue;

                    var detailJson = await detailsResponse.Content.ReadAsStringAsync();
                    var detail = JsonDocument.Parse(detailJson).RootElement;

                    var name = detail.GetProperty("name").GetString();
                    var kindsList = detail.GetProperty("kinds").GetString();
                    var point = detail.GetProperty("point");
                    var latDetail = point.GetProperty("lat").GetDouble();
                    var lonDetail = point.GetProperty("lon").GetDouble();

                    // Calculăm distanța
                    var distance = CalculateDistance(lat, lon, latDetail, lonDetail);

                    // Generăm link-ul către Google Maps
                    var mapsUrl = $"https://www.google.com/maps/search/?api=1&query={latDetail},{lonDetail}";

                    // Extragem descrierea din mai multe surse posibile
                    string description = "Nu există descriere disponibilă";
                    if (detail.TryGetProperty("wikipedia_extracts", out var wiki) && wiki.ValueKind == JsonValueKind.Object)
                    {
                        description = wiki.GetProperty("text").GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("descr", out var descr) && descr.ValueKind == JsonValueKind.String)
                    {
                        description = descr.GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("info", out var info) && info.ValueKind == JsonValueKind.Object)
                    {
                        description = info.GetProperty("descr").GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("wikipedia", out var wikiText) && wikiText.ValueKind == JsonValueKind.String)
                    {
                        description = wikiText.GetString() ?? description;
                    }

                    // Încercăm să obținem imaginea din Google Places
                    string image = await GetGooglePlaceImage(name, latDetail, lonDetail);

                    results.Add(new
                    {
                        Name = name,
                        Description = description,
                        Image = image,
                        Lat = latDetail,
                        Lon = lonDetail,
                        Kinds = kindsList,
                        Distance = Math.Round(distance, 2), // Distanța în kilometri, rotunjită la 2 zecimale
                        MapsUrl = mapsUrl
                    });
                }
                catch (Exception ex)
                {
                    // Continuăm cu următoarea atracție dacă avem o eroare
                    continue;
                }
            }
        }

        return Ok(results);
    }

        [HttpGet("nearby (without lat and lon)")]
    public async Task<IActionResult> GetNearbyAttractions(
        string location,
        int radius = 10000,
        string kinds = "interesting_places")
    {
        var coordinates = await GetCoordinatesFromLocation(location);
        var lon = coordinates[0];
        var lat = coordinates[1];
        var url = $"{BaseUrl}/radius?radius={radius}&lon={lon}&lat={lat}&kinds={kinds}&format=json&apikey={ApiKey}";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Eroare la apelarea OpenTripMap");

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(json).RootElement;
        
        var results = new List<object>();

        if (data.ValueKind == JsonValueKind.Array)
        {
            foreach (var feature in data.EnumerateArray())
            {
                try
                {
                    var xid = feature.GetProperty("xid").GetString();
                    var detailsUrl = $"{BaseUrl}/xid/{xid}?apikey={ApiKey}";
                    var detailsResponse = await _httpClient.GetAsync(detailsUrl);

                    if (!detailsResponse.IsSuccessStatusCode)
                        continue;

                    var detailJson = await detailsResponse.Content.ReadAsStringAsync();
                    var detail = JsonDocument.Parse(detailJson).RootElement;

                    var name = detail.GetProperty("name").GetString();
                    var kindsList = detail.GetProperty("kinds").GetString();
                    var point = detail.GetProperty("point");
                    var latDetail = point.GetProperty("lat").GetDouble();
                    var lonDetail = point.GetProperty("lon").GetDouble();

                    // Calculăm distanța
                    var distance = CalculateDistance(lat, lon, latDetail, lonDetail);

                    // Generăm link-ul către Google Maps
                    var mapsUrl = $"https://www.google.com/maps/search/?api=1&query={latDetail},{lonDetail}";

                    // Extragem descrierea din mai multe surse posibile
                    string description = "Nu există descriere disponibilă";
                    if (detail.TryGetProperty("wikipedia_extracts", out var wiki) && wiki.ValueKind == JsonValueKind.Object)
                    {
                        description = wiki.GetProperty("text").GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("descr", out var descr) && descr.ValueKind == JsonValueKind.String)
                    {
                        description = descr.GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("info", out var info) && info.ValueKind == JsonValueKind.Object)
                    {
                        description = info.GetProperty("descr").GetString() ?? description;
                    }
                    else if (detail.TryGetProperty("wikipedia", out var wikiText) && wikiText.ValueKind == JsonValueKind.String)
                    {
                        description = wikiText.GetString() ?? description;
                    }

                    // Încercăm să obținem imaginea din Google Places
                    string image = await GetGooglePlaceImage(name, latDetail, lonDetail);

                    results.Add(new
                    {
                        Name = name,
                        Description = description,
                        Image = image,
                        Lat = latDetail,
                        Lon = lonDetail,
                        Kinds = kindsList,
                        Distance = Math.Round(distance, 2), // Distanța în kilometri, rotunjită la 2 zecimale
                        MapsUrl = mapsUrl
                    });
                }
                catch (Exception ex)
                {
                    // Continuăm cu următoarea atracție dacă avem o eroare
                    continue;
                }
            }
        }

        return Ok(results);
    }

    private async Task<double[]> GetCoordinatesFromLocation(string location)
        {
            try
            {
                string url = $"https://api.openrouteservice.org/geocode/search?api_key={"5b3ce3597851110001cf6248f0889efb97c846d1869301f22972db7e"}&text={Uri.EscapeDataString(location)}";
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                _logger.LogInformation($"Răspuns geocoding pentru {location}: {json}");

                dynamic result = JsonConvert.DeserializeObject(json);

                if (result?.features == null || result.features.Count == 0)
                {
                    throw new Exception($"Nu s-a găsit locația: {location}");
                }

                var coordinates = result.features[0].geometry.coordinates;
                if (coordinates == null || coordinates.Count < 2)
                {
                    throw new Exception($"Coordonate invalide pentru locația: {location}");
                }

                return new double[] { (double)coordinates[0], (double)coordinates[1] }; // [lon, lat]
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Eroare la geocoding pentru {location}");
                throw;
            }
        }

    [HttpGet("attraction-types")]
    public IActionResult GetAttractionTypes()
    {
        var attractionTypes = new[]
        {
            new { value = "interesting_places", label = "Locuri interesante" },
            new { value = "cultural", label = "Atracții culturale" },
            new { value = "historic", label = "Locuri istorice" },
            new { value = "architecture", label = "Arhitectură" },
            new { value = "museums", label = "Muzee" },
            new { value = "monuments_and_memorials", label = "Monumente și memoriale" },
            new { value = "churches", label = "Biserici" },
            new { value = "castles", label = "Castele" },
            new { value = "natural", label = "Atracții naturale" },
            new { value = "parks", label = "Parcuri" },
            new { value = "gardens", label = "Grădini" },
            new { value = "beaches", label = "Plaje" },
            new { value = "mountains", label = "Munți" },
            new { value = "lakes", label = "Lacuri" },
            new { value = "rivers", label = "Râuri" },
            new { value = "waterfalls", label = "Cascade" },
            new { value = "caves", label = "Peșteri" },
            new { value = "entertainment", label = "Divertisment" },
            new { value = "theatres_and_entertainments", label = "Teatre și divertisment" },
            new { value = "cinemas", label = "Cinema" },
            new { value = "sport", label = "Sport" },
            new { value = "stadiums", label = "Stadioane" },
            new { value = "sport_facilities", label = "Facilități sportive" },
            new { value = "foods", label = "Restaurante și cafenele" },
            new { value = "restaurants", label = "Restaurante" },
            new { value = "cafes", label = "Cafenele" },
            new { value = "shops", label = "Magazine" },
            new { value = "malls", label = "Mall-uri" },
            new { value = "markets", label = "Piețe" },
            new { value = "other_attractions", label = "Alte atracții" }
        };

        return Ok(attractionTypes);
    }
}

