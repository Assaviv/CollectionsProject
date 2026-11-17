using CollectionsDB.Api.Users;
using CollectionsDB.Application.Collections;
using CollectionsDB.Application.Rag;
using CollectionsDB.Application.Users;
using CollectionsDB.Configuration;
using CollectionsDB.Persistence;
using CollectionsDB.Persistence.Repositories;
using CollectionsDB.Services.Embeddings;
using CollectionsDB.Api.Contracts.Search;
using Microsoft.OpenApi;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using CollectionsDB.Services.Llm;
using CollectionsDB.Infrastructure.Messaging;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
    options.MapType<SearchCardsRequest>(() => new OpenApiSchema { Type = JsonSchemaType.String }));
builder.Services.AddControllers();

builder.Services.Configure<CollectionsDBSettings>(builder.Configuration.GetSection("CollectionsDB"));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<CurrentUser>();
builder.Services.AddScoped<ICurrentUser>(sp => sp.GetRequiredService<CurrentUser>());
builder.Services.AddScoped<IUserContext>(sp => sp.GetRequiredService<CurrentUser>());
builder.Services.AddHealthChecks();

// Transactional outbox → Kafka (saveapp.cards.v1, saveapp.collections.v1)
builder.AddMessaging();

// Database: EF Core + Npgsql + pgvector
builder.Services.AddDbContext<CollectionsDBContext>((sp, options) =>
{
    var settings = sp.GetRequiredService<IOptions<CollectionsDBSettings>>().Value;
    options.UseNpgsql(settings.ConnectionString, o => o.UseVector());
});

builder.Services.AddScoped<ICollectionsRepository, EfCollectionsRepository>();
builder.Services.AddScoped<ICollectionsService, CollectionsService>();
builder.Services.AddScoped<IRagService, RagService>();

builder.Services.AddHttpClient<EmbeddingService>();
builder.Services.AddHttpClient<OllamaCardAnswerService>(c => c.Timeout = TimeSpan.FromMinutes(2));

var app = builder.Build();

if (!builder.Configuration.IsKafkaConfigured())
{
    app.Logger.LogWarning("Kafka is not configured (ConnectionStrings:kafka). Events are kept in outbox_messages and published once it is.");
}

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CollectionsDBContext>();
    db.Database.Migrate();
}

app.MapControllers();
app.MapHealthChecks("/health");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.Run();
