using CollectionsService.Models;
using CollectionsService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers();
builder.Services.Configure<CollectionsDBSettings>(
    builder.Configuration.GetSection("CollectionsDB"));
builder.Services.AddSingleton<CollectionsApiInterface, InMemoryService>();
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAngularApp", builder => builder.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();
app.UseCors("AllowAngularApp");
app.MapControllers();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.Run();
