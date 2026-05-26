using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/files")]
public class FilesController(FileStorageService storage) : ControllerBase
{
    // POST /api/files/upload
    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file provided" });

        var storageId = storage.GenerateStorageId();
        using var stream = file.OpenReadStream();
        var fileUrl = await storage.SaveFileAsync(storageId, stream, file.ContentType);

        return Ok(new { storageId, fileUrl });
    }

    // GET /api/files/{filename}  (e.g. abc123.jpg)
    [HttpGet("{filename}")]
    public IActionResult Serve(string filename)
    {
        var storageId = Path.GetFileNameWithoutExtension(filename);
        var filePath = storage.GetFilePath(storageId);
        if (filePath == null) return NotFound();

        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        var contentType = ext switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".gif" => "image/gif",
            ".webp" => "image/webp",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".mp3" => "audio/mpeg",
            ".ogg" => "audio/ogg",
            ".wav" => "audio/wav",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };

        var stream = System.IO.File.OpenRead(filePath);
        return File(stream, contentType, enableRangeProcessing: true);
    }
}
