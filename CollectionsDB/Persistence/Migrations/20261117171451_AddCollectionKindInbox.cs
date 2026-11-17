using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CollectionsDB.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCollectionKindInbox : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "collections",
                type: "text",
                nullable: false,
                defaultValue: "NORMAL");

            migrationBuilder.CreateIndex(
                name: "IX_collections_UserId_Inbox",
                table: "collections",
                column: "UserId",
                unique: true,
                filter: "\"Kind\" = 'INBOX'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_collections_UserId_Inbox",
                table: "collections");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "collections");
        }
    }
}
