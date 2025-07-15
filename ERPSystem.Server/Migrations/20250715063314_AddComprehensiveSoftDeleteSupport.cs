using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPSystem.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddComprehensiveSoftDeleteSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductSuppliers_Products_ProductId",
                table: "ProductSuppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductSuppliers_Suppliers_SupplierId",
                table: "ProductSuppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_StockAdjustments_Products_ProductId",
                table: "StockAdjustments");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StockMovements",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StockMovements",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StockMovements",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "StockAdjustments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "StockAdjustments",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "StockAdjustments",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "PurchaseOrderItems",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "PurchaseOrderItems",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "PurchaseOrderItems",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ProductSuppliers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductSuppliers_Products_ProductId",
                table: "ProductSuppliers",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductSuppliers_Suppliers_SupplierId",
                table: "ProductSuppliers",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockAdjustments_Products_ProductId",
                table: "StockAdjustments",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductSuppliers_Products_ProductId",
                table: "ProductSuppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductSuppliers_Suppliers_SupplierId",
                table: "ProductSuppliers");

            migrationBuilder.DropForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems");

            migrationBuilder.DropForeignKey(
                name: "FK_StockAdjustments_Products_ProductId",
                table: "StockAdjustments");

            migrationBuilder.DropForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StockMovements");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "StockAdjustments");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "StockAdjustments");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "StockAdjustments");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "PurchaseOrderItems");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ProductSuppliers");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductSuppliers_Products_ProductId",
                table: "ProductSuppliers",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductSuppliers_Suppliers_SupplierId",
                table: "ProductSuppliers",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId",
                table: "PurchaseOrderItems",
                column: "PurchaseOrderId",
                principalTable: "PurchaseOrders",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StockAdjustments_Products_ProductId",
                table: "StockAdjustments",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovements_Products_ProductId",
                table: "StockMovements",
                column: "ProductId",
                principalTable: "Products",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
