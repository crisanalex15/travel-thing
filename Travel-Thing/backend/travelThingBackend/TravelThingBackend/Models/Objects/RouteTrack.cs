using System;
using System.ComponentModel.DataAnnotations;

namespace TravelThingBackend.Models.Objects
{
    public class RouteTrack
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public double Distance { get; set; } // in kilometers

        [Required]
        public double AverageFuelConsumption { get; set; } // liters per 100km

        [Required]
        public double FuelPrice { get; set; } // price per liter

        [Required]
        public string? StartLocation { get; set; }

        [Required]
        public string? EndLocation { get; set; }

        public DateTime StartTime { get; set; }

        public DateTime EndTime { get; set; }

        public double TotalFuelCost => (Distance / 100) * AverageFuelConsumption * FuelPrice;

        public TimeSpan Duration => EndTime - StartTime;

        public double AverageSpeed => Distance / Duration.TotalHours;
    }
}
