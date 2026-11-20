using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollectionsDB.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ReplacePositionWithRank : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Rank",
                table: "cards",
                type: "text",
                nullable: false,
                defaultValue: "",
                collation: "C");

            migrationBuilder.DropIndex(
                name: "IX_cards_CollectionId_Position",
                table: "cards");

            migrationBuilder.DropColumn(
                name: "Position",
                table: "cards");

            migrationBuilder.CreateIndex(
                name: "IX_cards_CollectionId_Rank",
                table: "cards",
                columns: new[] { "CollectionId", "Rank" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_cards_CollectionId_Rank",
                table: "cards");

            migrationBuilder.DropColumn(
                name: "Rank",
                table: "cards");

            migrationBuilder.AddColumn<int>(
                name: "Position",
                table: "cards",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_cards_CollectionId_Position",
                table: "cards",
                columns: new[] { "CollectionId", "Position" });
        }
    }
}
