using System.Text.Json.Serialization;

namespace CollectionsDB.Services.Embeddings;

public sealed class EmbeddingService
{
    private readonly HttpClient _httpClient;
    private readonly string _endpoint;
    private readonly string _model;

    public EmbeddingService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _endpoint = configuration["Embedding:Endpoint"]
            ?? "http://localhost:12434/engines/llama.cpp/v1/embeddings";
        _model = configuration["Embedding:Model"] ?? "ai/nomic-embed-text-v1.5";
    }

    public Task<List<float>> GetDocumentEmbeddingAsync(string text)
        => GetEmbeddingAsync($"search_document: {text}");

    public Task<List<float>> GetQueryEmbeddingAsync(string text)
        => GetEmbeddingAsync($"search_query: {text}");

    /// <summary>Gets the embedding vector for the supplied text from the local model.</summary>
    private async Task<List<float>> GetEmbeddingAsync(
        string text,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(text);

        using var response = await _httpClient.PostAsJsonAsync(
            _endpoint,
            new EmbeddingRequest(_model, text),
            cancellationToken);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<EmbeddingResponse>(
            cancellationToken: cancellationToken);

        return result?.Data.FirstOrDefault()?.Embedding
            ?? throw new InvalidOperationException("The embedding service returned no embedding vector.");
    }

    private sealed record EmbeddingRequest(
        [property: JsonPropertyName("model")] string Model,
        [property: JsonPropertyName("input")] string Input);

    private sealed class EmbeddingResponse
    {
        [JsonPropertyName("data")]
        public List<EmbeddingData> Data { get; init; } = [];
    }

    private sealed class EmbeddingData
    {
        [JsonPropertyName("embedding")]
        public List<float>? Embedding { get; init; }
    }
}
