using CollectionsDB.Data;
using CollectionsDB.Models;
using CollectionsDB.Services.Ai;
using Microsoft.Extensions.Options;
using Microsoft.EntityFrameworkCore;
using CollectionsDB.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();

builder.Services.Configure<CollectionsDBSettings>(builder.Configuration.GetSection("CollectionsDB"));

// Database: EF Core + Npgsql + pgvector
builder.Services.AddDbContext<CollectionsDBContext>((sp, options) =>
{
    var settings = sp.GetRequiredService<IOptions<CollectionsDBSettings>>().Value;
    options.UseNpgsql(settings.ConnectionString, o => o.UseVector());
});

builder.Services.AddScoped<CollectionsApiInterface, EfCollectionsRepository>();

builder.Services.AddHttpClient<EmbeddingService>();

builder.Services.AddCors(options => 
{
    options.AddPolicy("AllowAngularApp", policy => 
            policy.WithOrigins("http://collections-ui-collections.dev.localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CollectionsDBContext>();
    db.Database.Migrate();
}

app.UseCors("AllowAngularApp");
app.MapControllers();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.Run();
