[HttpPost("upload-photo")]
public async Task<IActionResult> UploadPhoto(IFormFile file)
{
    var userIdClaim = User.FindFirstValue(AuthOptions.UserIdClaimType);
    if (!int.TryParse(userIdClaim, out int userId))
    {
        return Unauthorized();
    }

    if (file == null || file.Length == 0)
    {
        return BadRequest("Файл не предоставлен.");
    }

    // Проверка расширения файла
    var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
    var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
    if (!allowedExtensions.Contains(fileExtension))
    {
        return BadRequest("Допустимы только файлы изображений (JPG, JPEG, PNG).");
    }

    // Уникальное имя файла
    var fileName = $"user_{userId}_{DateTime.Now:yyyyMMddHHmmss}{fileExtension}";
    var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");

    // Создаём папку, если её нет
    if (!Directory.Exists(uploadsFolder))
    {
        Directory.CreateDirectory(uploadsFolder);
    }

    var filePath = Path.Combine(uploadsFolder, fileName);

    // Сохраняем файл на диск
    using (var stream = new FileStream(filePath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    // Находим пользователя в БД
    var user = await _context.Users.FindAsync(userId);
    if (user == null)
    {
        return NotFound("Пользователь не найден.");
    }

    // Удаляем старое фото, если оно есть
    if (!string.IsNullOrEmpty(user.PhotoUrl))
    {
        var oldFilePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", user.PhotoUrl.TrimStart('/'));
        if (System.IO.File.Exists(oldFilePath))
        {
            System.IO.File.Delete(oldFilePath);
        }
    }

    // Обновляем путь к новому фото
    user.PhotoUrl = $"/uploads/{fileName}";
    _context.Users.Update(user);
    await _context.SaveChangesAsync();

    // Возвращаем URL нового фото
    return Ok(new { photoUrl = user.PhotoUrl });
}
