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

            // Dev databases only (no production data): turn each collection's Position order into valid
            // fractional-indexing ranks, a0..az then b00..bzz (3,906 cards per collection is plenty).
            migrationBuilder.Sql("""
                UPDATE cards AS c
                SET "Rank" = CASE
                    WHEN r.n < 62 THEN 'a' || substr(r.d, r.n + 1, 1)
                    ELSE 'b' || substr(r.d, (r.n - 62) / 62 + 1, 1) || substr(r.d, (r.n - 62) % 62 + 1, 1)
                END
                FROM (
                    SELECT "Id",
                           (row_number() OVER (PARTITION BY "CollectionId" ORDER BY "Position", "Id") - 1)::int AS n,
                           '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'::text AS d
                    FROM cards
                ) AS r
                WHERE c."Id" = r."Id";
                """);

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
