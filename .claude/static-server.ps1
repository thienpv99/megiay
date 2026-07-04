param(
  [string]$Root = ".",
  [int]$Port = 8123
)

$ErrorActionPreference = "Stop"
$Root = (Resolve-Path $Root).Path

$mime = @{
  ".html"="text/html; charset=utf-8"; ".htm"="text/html; charset=utf-8";
  ".css"="text/css; charset=utf-8"; ".js"="application/javascript; charset=utf-8";
  ".mjs"="application/javascript; charset=utf-8"; ".json"="application/json; charset=utf-8";
  ".xml"="application/xml; charset=utf-8"; ".svg"="image/svg+xml"; ".png"="image/png";
  ".jpg"="image/jpeg"; ".jpeg"="image/jpeg"; ".gif"="image/gif"; ".ico"="image/x-icon";
  ".webp"="image/webp"; ".woff"="font/woff"; ".woff2"="font/woff2"; ".txt"="text/plain; charset=utf-8"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "Serving $Root at http://localhost:$Port/"

while ($listener.IsListening) {
  try {
    $ctx = $listener.GetContext()
    $req = $ctx.Request
    $res = $ctx.Response

    $rel = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart("/"))
    if ($rel -eq "") { $rel = "index.html" }
    $path = Join-Path $Root $rel

    # Directory -> index.html
    if (Test-Path $path -PathType Container) { $path = Join-Path $path "index.html" }
    # Extensionless dir request without trailing slash
    if (-not (Test-Path $path) -and (Test-Path (Join-Path $Root ($rel + "/index.html")))) {
      $path = Join-Path $Root ($rel + "/index.html")
    }

    $isHead = ($req.HttpMethod -eq "HEAD")
    if (Test-Path $path -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($path).ToLower()
      $ct = $mime[$ext]; if (-not $ct) { $ct = "application/octet-stream" }
      $bytes = [System.IO.File]::ReadAllBytes($path)
      $res.ContentType = $ct
      $res.ContentLength64 = $bytes.Length
      if (-not $isHead) { $res.OutputStream.Write($bytes, 0, $bytes.Length) }
    } else {
      $res.StatusCode = 404
      $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rel")
      $res.ContentLength64 = $msg.Length
      if (-not $isHead) { $res.OutputStream.Write($msg, 0, $msg.Length) }
    }
    $res.OutputStream.Close()
  } catch {
    Write-Host "err: $($_.Exception.Message)"
  }
}
