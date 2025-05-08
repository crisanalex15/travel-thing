using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelThingBackend.Data;
using TravelThingBackend.Models;
using TravelThingBackend.Services;

namespace TravelThingBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FuelPriceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly FuelPriceService _fuelPriceService;
        private readonly ILogger<FuelPriceController> _logger;

        public FuelPriceController(
            ApplicationDbContext context,
            FuelPriceService fuelPriceService,
            ILogger<FuelPriceController> logger)
        {
            _context = context;
            _fuelPriceService = fuelPriceService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<FuelPrice>>> GetAllPrices()
        {
            return await _context.FuelPrices
                .OrderBy(p => p.City)
                .ThenBy(p => p.FuelType)
                .ToListAsync();
        }

        [HttpGet("city/{city}")]
        public async Task<ActionResult<IEnumerable<FuelPrice>>> GetPricesByCity(string city)
        {
            var prices = await _context.FuelPrices
                .Where(p => p.City == city)
                .OrderBy(p => p.FuelType)
                .ToListAsync();

            if (!prices.Any())
            {
                return NotFound($"Nu s-au găsit prețuri pentru orașul {city}");
            }

            return prices;
        }

        [HttpPost("update")]
        public async Task<IActionResult> UpdatePrices()
        {
            try
            {
                await _fuelPriceService.UpdateFuelPricesAsync();
                return Ok("Prețurile au fost actualizate cu succes");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Eroare la actualizarea prețurilor");
                return StatusCode(500, "A apărut o eroare la actualizarea prețurilor");
            }
        }

        [HttpGet("average")]
        public async Task<ActionResult<Dictionary<string, decimal>>> GetAveragePrices()
        {
            var averages = await _context.FuelPrices
                .GroupBy(p => p.FuelType)
                .Select(g => new
                {
                    FuelType = g.Key,
                    AveragePrice = g.Average(p => p.Price)
                })
                .ToDictionaryAsync(x => x.FuelType, x => x.AveragePrice);

            return averages;
        }
    }
} 