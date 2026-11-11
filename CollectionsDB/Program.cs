using CollectionsDB.Api.Users;
using CollectionsDB.Application.Collections;
using CollectionsDB.Application.Users;
using CollectionsDB.Configuration;
using CollectionsDB.Persistence;
using CollectionsDB.Persistence.Repositories;
using CollectionsDB.Services.Embeddings;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

builder.Services.Configure<CollectionsDBSettings>(builder.Configuration.GetSection("CollectionsDB"));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();

// Database: EF Core + Npgsql + pgvector
builder.Services.AddDbContext<CollectionsDBContext>((sp, options) =>
{
    var settings = sp.GetRequiredService<IOptions<CollectionsDBSettings>>().Value;
    options.UseNpgsql(settings.ConnectionString, o => o.UseVector());
});

builder.Services.AddScoped<ICollectionsRepository, EfCollectionsRepository>();
builder.Services.AddScoped<ICollectionsService, CollectionsService>();

builder.Services.AddHttpClient<EmbeddingService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CollectionsDBContext>();
    db.Database.Migrate();
}

app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.Run();
