using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPSystem.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesOrderForeignKeyToStockReservation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "SalesOrderId",
                table: "StockReservations",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AlterColumn<string>(
                name: "ReferenceNumber",
                table: "SalesOrders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_StockReservations_SalesOrderId",
                table: "StockReservations",
                column: "SalesOrderId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockReservations_SalesOrders_SalesOrderId",
                table: "StockReservations",
                column: "SalesOrderId",
                principalTable: "SalesOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockReservations_SalesOrders_SalesOrderId",
                table: "StockReservations");

            migrationBuilder.DropIndex(
                name: "IX_StockReservations_SalesOrderId",
                table: "StockReservations");

            migrationBuilder.DropColumn(
                name: "SalesOrderId",
                table: "StockReservations");

            migrationBuilder.AlterColumn<string>(
                name: "ReferenceNumber",
                table: "SalesOrders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);
        }
    }
}
