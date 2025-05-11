/*5ae2e3f221c38a28845f05b669b15222856ba95debb9052a3c22159a*/
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;

[ApiController]
[Route("api/[controller]")]
public class TouristAttractionsController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private const string ApiKey = "5ae2e3f221c38a28845f05b669b15222856ba95debb9052a3c22159a"; // înlocuiește cu cheia ta
    private const string BaseUrl = "https://api.opentripmap.com/0.1/en/places/radius";

    public TouristAttractionsController(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [HttpGet("nearby")]
    public async Task<IActionResult> GetNearbyAttractions(
        double lat,
        double lon,
        int radius = 10000,
        string kinds = "interesting_places")
    {
        var url = $"{BaseUrl}?radius={radius}&lon={lon}&lat={lat}&kinds={kinds}&format=json&apikey={ApiKey}";

        var response = await _httpClient.GetAsync(url);
        if (!response.IsSuccessStatusCode)
            return StatusCode((int)response.StatusCode, "Eroare la apelarea OpenTripMap");

        var json = await response.Content.ReadAsStringAsync();
        var data = JsonDocument.Parse(json).RootElement;

        return Ok(data);
    }
}
