param(
  [string]$Origin = "https://cbt.itisnowornever271.workers.dev",
  [string]$CacheKey = "round2-production-check"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$client = [System.Net.Http.HttpClient]::new()
$failures = @()

try {
  foreach ($number in 1..30) {
    $part = if ($number -le 15) { "part1" } else { "part2" }
    $paddedNumber = $number.ToString("00")
    $relativePath = "assets/audio/grade2/set-02/$part/simba-3.2-final/No$paddedNumber.wav"
    $localPath = Join-Path (Get-Location) $relativePath.Replace("/", "\")
    $localBytes = [System.IO.File]::ReadAllBytes($localPath)
    $expectedPrefix = [Convert]::ToBase64String($localBytes[0..99])

    $request = [System.Net.Http.HttpRequestMessage]::new(
      [System.Net.Http.HttpMethod]::Get,
      "$Origin/$relativePath`?v=$CacheKey-$paddedNumber"
    )
    $request.Headers.Range = [System.Net.Http.Headers.RangeHeaderValue]::new(0, 99)
    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $responseBytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    $actualPrefix = [Convert]::ToBase64String($responseBytes)
    $contentRange = $response.Content.Headers.ContentRange

    $ok = (
      [int]$response.StatusCode -eq 206 -and
      $response.Content.Headers.ContentType.MediaType -eq "audio/wav" -and
      $response.Headers.AcceptRanges -contains "bytes" -and
      $contentRange.From -eq 0 -and
      $contentRange.To -eq 99 -and
      $contentRange.Length -eq $localBytes.Length -and
      $responseBytes.Length -eq 100 -and
      $actualPrefix -eq $expectedPrefix
    )

    [pscustomobject]@{
      Number = $paddedNumber
      Status = [int]$response.StatusCode
      Bytes = $responseBytes.Length
      Total = $contentRange.Length
      Match = $ok
    }

    if (-not $ok) {
      $failures += "No$paddedNumber"
    }

    $response.Dispose()
    $request.Dispose()
  }
} finally {
  $client.Dispose()
}

if ($failures.Count -gt 0) {
  throw "Production WAV verification failed: $($failures -join ', ')"
}

Write-Host "Verified: 30/30 production WAV files"
