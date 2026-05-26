namespace backend.Services;

public class FileStorageService(IWebHostEnvironment env, IHttpContextAccessor httpContextAccessor)
{
    private readonly string _uploadsPath = Path.Combine(env.ContentRootPath, "Uploads");

    public string GenerateStorageId() => Guid.NewGuid().ToString("N");

    public async Task<string> SaveFileAsync(string storageId, Stream stream, string contentType)
    {
        Directory.CreateDirectory(_uploadsPath);
        var ext = GetExtension(contentType);
        var fileName = $"{storageId}{ext}";
        var filePath = Path.Combine(_uploadsPath, fileName);

        await using var fs = File.Create(filePath);
        await stream.CopyToAsync(fs);

        return GetFileUrl(storageId, ext);
    }

    public string GetFileUrl(string storageId, string? ext = null)
    {
        var req = httpContextAccessor.HttpContext?.Request;
        var baseUrl = req != null
            ? $"{req.Scheme}://{req.Host}"
            : "http://localhost:5000";

        if (ext != null)
            return $"{baseUrl}/api/files/{storageId}{ext}";

        // find existing file
        var files = Directory.GetFiles(_uploadsPath, $"{storageId}.*");
        if (files.Length > 0)
        {
            var foundExt = Path.GetExtension(files[0]);
            return $"{baseUrl}/api/files/{storageId}{foundExt}";
        }
        return $"{baseUrl}/api/files/{storageId}";
    }

    public string? GetFilePath(string storageId)
    {
        var files = Directory.GetFiles(_uploadsPath, $"{storageId}.*");
        return files.Length > 0 ? files[0] : null;
    }

    private static string GetExtension(string contentType) => contentType switch
    {
        "image/jpeg" => ".jpg",
        "image/png" => ".png",
        "image/gif" => ".gif",
        "image/webp" => ".webp",
        "video/mp4" => ".mp4",
        "video/webm" => ".webm",
        "audio/webm" => ".webm",
        "audio/mp4" => ".mp4",
        "audio/mpeg" => ".mp3",
        _ => ".bin"
    };
}
