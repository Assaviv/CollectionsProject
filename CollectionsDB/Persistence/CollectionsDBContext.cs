using CollectionsDB.Application.Users;
using CollectionsDB.Domain.Cards;
using CollectionsDB.Domain.Collections;
using Microsoft.EntityFrameworkCore;

namespace CollectionsDB.Persistence;

public sealed class CollectionsDBContext : DbContext
{
    private const string UserIdProperty = "UserId";

    public DbSet<Collection> Collections => Set<Collection>();
    public DbSet<Card> Cards => Set<Card>();
    public DbSet<CardEmbedding> CardEmbeddings => Set<CardEmbedding>();

    private readonly ICurrentUser _currentUser;

    private string CurrentUserId => _currentUser.UserId;

    public CollectionsDBContext(DbContextOptions<CollectionsDBContext> options, ICurrentUser currentUser)
        : base(options)
    {
        _currentUser = currentUser;
    }

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
            e.Property(c => c.UserId).IsRequired();

            // Insertion order of collections (replaces the old "ordinal" column).
            e.Property<long>("Ordinal").ValueGeneratedOnAdd().UseIdentityByDefaultColumn();

            e.HasIndex(c => c.UserId);
            e.HasQueryFilter(c => c.UserId == CurrentUserId);
        });

        modelBuilder.Entity<Card>(e =>
        {
            e.ToTable("cards");
            e.HasKey(c => c.Id);
            e.Property(c => c.CollectionId).IsRequired();
            e.Property(c => c.Position).IsRequired();
            e.Property(c => c.Value).HasColumnType("jsonb");
            e.Property(c => c.CardType).HasConversion<string>();   // stores "STORY" instead of 1

            // Denormalized owner so the filter is a plain column compare, not a join.
            // Shadow property: no change needed in the Card model.
            e.Property<string>(UserIdProperty).IsRequired();

            // The embedding lives in card_embeddings, not on this table.
            e.Ignore(c => c.Embedding);

            // One index range scan loads a whole collection, already in order.
            e.HasIndex(c => new { c.CollectionId, c.Position });

            e.HasOne<Collection>()
                .WithMany(c => c.Cards)
                .HasForeignKey(c => c.CollectionId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasQueryFilter(c => EF.Property<string>(c, UserIdProperty) == CurrentUserId);
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

            // Follows the card's owner through the navigation.
            e.HasQueryFilter(x => EF.Property<string>(x.Card, UserIdProperty) == CurrentUserId);
        });
    }

    // Stamp the owner on every new row so no repository method can forget it.
    public override int SaveChanges(bool acceptAllChangesOnSuccess)
    {
        StampOwner();
        return base.SaveChanges(acceptAllChangesOnSuccess);
    }

    public override Task<int> SaveChangesAsync(
        bool acceptAllChangesOnSuccess, CancellationToken cancellationToken = default)
    {
        StampOwner();
        return base.SaveChangesAsync(acceptAllChangesOnSuccess, cancellationToken);
    }

    private void StampOwner()
    {
        foreach (var entry in ChangeTracker.Entries().Where(e => e.State == EntityState.Added))
        {
            switch (entry.Entity)
            {
                case Collection collection:
                    collection.UserId = CurrentUserId;
                    break;
                case Card:
                    entry.Property(UserIdProperty).CurrentValue = CurrentUserId;
                    break;
            }
        }
    }
}
