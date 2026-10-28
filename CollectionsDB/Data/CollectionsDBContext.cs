using CollectionsDB.Models;
using Microsoft.EntityFrameworkCore;

namespace CollectionsDB.Data;

public sealed class CollectionsDBContext(DbContextOptions<CollectionsDBContext> options)
    : DbContext(options)
{
    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<CardEmbedding> CardEmbeddings => Set<CardEmbedding>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Emits CREATE EXTENSION IF NOT EXISTS vector in the migration.
        modelBuilder.HasPostgresExtension("vector");

        modelBuilder.Entity<Collection>(e =>
        {
            e.ToTable("collections");
            e.HasKey(c => c.Id);
            e.Property(c => c.Title).IsRequired();
            e.Property(c => c.Description).IsRequired();
            e.Property(c => c.Emoji).IsRequired();

            // Insertion order of collections (replaces the old "ordinal" column).
            e.Property<long>("Ordinal").ValueGeneratedOnAdd().UseIdentityByDefaultColumn();
        });

        modelBuilder.Entity<Card>(e =>
        {
            e.ToTable("cards");
            e.HasKey(c => c.Id);
            e.Property(c => c.CollectionId).IsRequired();
            e.Property(c => c.Position).IsRequired();
            e.Property(c => c.Value).HasColumnType("jsonb");
            e.Property(c => c.CardType).HasConversion<string>();   // stores "STORY" instead of 1

            // The embedding lives in card_embeddings, not on this table.
            e.Ignore(c => c.Embedding);

            // One index range scan loads a whole collection, already in order.
            e.HasIndex(c => new { c.CollectionId, c.Position });

            e.HasOne<Collection>()
                .WithMany(c => c.Cards)
                .HasForeignKey(c => c.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<CardEmbedding>(e =>
        {
            e.ToTable("card_embeddings");
            e.HasKey(x => x.CardId);
            e.Property(x => x.Embedding).HasColumnType("vector(768)").IsRequired();

            e.HasIndex(x => x.Embedding)
                .HasMethod("hnsw")
                .HasOperators("vector_l2_ops");

            e.HasOne(x => x.Card)
                .WithOne()
                .HasForeignKey<CardEmbedding>(x => x.CardId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
