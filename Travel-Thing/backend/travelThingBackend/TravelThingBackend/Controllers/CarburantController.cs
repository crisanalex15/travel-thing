using Microsoft.AspNetCore.Mvc;
using HtmlAgilityPack;
using System.Net.Http;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;

namespace TravelThingBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarburantController : ControllerBase
    {
        [HttpGet("pret")]
        public async Task<IActionResult> GetPret([FromQuery] string locatie, [FromQuery] string tip, [FromQuery] string nume_locatie, [FromQuery] string retea = "Petrom")
        {
            var pret = await GetPretCarburantAsync(locatie, tip, nume_locatie, retea);
            return Ok(new { pret });
        }

        [HttpGet("preturi")]
        public async Task<IActionResult> GetPreturi([FromQuery] string locatie, [FromQuery] string tip, [FromQuery] string nume_locatie, [FromQuery] string retea = "Petrom")
        {
            var rezultate = await GetPreturiCarburantAsync(locatie, tip, nume_locatie, retea);
            return Ok(rezultate.Select(r => new { pret = r.Pret, adresa = r.Adresa }));
        }

        private async Task<string> GetPretCarburantAsync(string locatie, string tip, string nume_locatie, string retea)
        {
            var url = "https://www.peco-online.ro/index.php";
            using var httpClient = new HttpClient();

            var formData = new Dictionary<string, string>
            {
                { "carburant", tip },
                { "locatie", locatie },
                { "nume_locatie", nume_locatie },
                { "Submit", "Cauta" },
                { "retea[]", retea }
            };

            var content = new FormUrlEncodedContent(formData);
            var response = await httpClient.PostAsync(url, content);
            var html = await response.Content.ReadAsStringAsync();

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var rows = doc.DocumentNode.SelectNodes("//table//tr");
            if (rows != null)
            {
                foreach (var row in rows)
                {
                    var cells = row.SelectNodes("td");
                    if (cells != null && cells.Count >= 2)
                    {
                        var pret = cells[0].InnerText.Trim();
                        if (decimal.TryParse(pret.Replace(",", "."), out var pretVal) && pretVal > 5 && pretVal < 15)
                            return pret;
                    }
                }
            }
            return "N/A";
        }

        private async Task<List<(string Pret, string Adresa)>> GetPreturiCarburantAsync(string locatie, string tip, string nume_locatie, string retea)
        {
            var url = "https://www.peco-online.ro/index.php";
            using var httpClient = new HttpClient();

            var formData = new Dictionary<string, string>
            {
                { "carburant", tip }, 
                /*
                "Benzina_Regular" — Benzina Standard
                "Motorina_Regular" — Motorina Standard (Diesel)
                "GPL" — GPL
                "Benzina_Premium" — Benzina Superioara
                "Motorina_Premium" — Motorina Superioara
                "AdBlue" — AdBlue
                */
                { "locatie", locatie },
                /*
                "Oras" — Oras
                "Judet" — Judet
                */
                { "nume_locatie", nume_locatie },
                /*
                "Arad" — Arad
                */
                { "Submit", "Cauta" },
                { "retea[]", retea }
                /*
                "Petrom" — Petrom
                "Mobil" — Mobil
                "Rompetrol" — Rompetrol
                "Shell" — Shell
                "Lukoil" — Lukoil
                */
            };

            var content = new FormUrlEncodedContent(formData);
            var response = await httpClient.PostAsync(url, content);
            var html = await response.Content.ReadAsStringAsync();

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            var results = new List<(string Pret, string Adresa)>();
            var rows = doc.DocumentNode.SelectNodes("//table//tr");
            if (rows != null)
            {
                foreach (var row in rows)
                {
                    var cells = row.SelectNodes("td");
                    if (cells != null && cells.Count >= 2)
                    {
                        var pret = cells[0].InnerText.Trim();
                        var adresa = cells[1].InnerText.Trim();
                        results.Add((pret, adresa));
                    }
                }
            }
            return results;
        }
    }
} 