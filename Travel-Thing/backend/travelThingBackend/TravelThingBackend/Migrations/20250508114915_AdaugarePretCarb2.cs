using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelThingBackend.Migrations
{
    /// <inheritdoc />
    public partial class AdaugarePretCarb2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FuelPrices");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FuelPrices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    DieselPremium = table.Column<double>(type: "REAL", nullable: false),
                    DieselStandard = table.Column<double>(type: "REAL", nullable: false),
                    Electric = table.Column<double>(type: "REAL", nullable: false),
                    GPL = table.Column<double>(type: "REAL", nullable: false),
                    GasPremium = table.Column<double>(type: "REAL", nullable: false),
                    GasStandard = table.Column<double>(type: "REAL", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FuelPrices", x => x.Id);
                });
        }
    }
}
