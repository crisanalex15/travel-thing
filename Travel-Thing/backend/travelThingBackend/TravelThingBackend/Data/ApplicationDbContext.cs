using Microsoft.EntityFrameworkCore;
using TravelThingBackend.Models;

namespace TravelThingBackend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<FuelPrice> FuelPrices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Adăugăm un index unic pentru combinația City și FuelType
            modelBuilder.Entity<FuelPrice>()
                .HasIndex(p => new { p.City, p.FuelType })
                .IsUnique();
        }
    }
} 