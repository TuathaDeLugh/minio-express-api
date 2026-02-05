# Upload Limit Test Script

Write-Host "=== Testing Upload File Limit (20 files max) ===" -ForegroundColor Cyan
Write-Host ""

# Create test files
Write-Host "Creating 25 test files..." -ForegroundColor Yellow
$testFiles = @()
for ($i = 1; $i -le 25; $i++) {
    $fileName = "test-file-$i.txt"
    "Test content for file $i" | Out-File -FilePath $fileName -Encoding UTF8
    $testFiles += $fileName
}

Write-Host "Created 25 test files" -ForegroundColor Green
Write-Host ""

# Test: Upload 25 files (should only upload first 20)
Write-Host "Test: Uploading 25 files (expecting limit warning)" -ForegroundColor Yellow

$curlArgs = @(
    "-X", "POST",
    "http://localhost:4000/upload",
    "-F", "bucket=testing"
)

foreach ($file in $testFiles) {
    $curlArgs += "-F"
    $curlArgs += "files=@$file"
}

$curlArgs += "-s"

$response = & curl.exe $curlArgs

Write-Host "Response:" -ForegroundColor Green
$responseObj = $response | ConvertFrom-Json
$responseObj | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "  Message: $($responseObj.message)" -ForegroundColor White
if ($responseObj.warning) {
    Write-Host "  Warning: $($responseObj.warning)" -ForegroundColor Yellow
    Write-Host "  Total Received: $($responseObj.totalReceived)" -ForegroundColor White
    Write-Host "  Uploaded: $($responseObj.uploaded)" -ForegroundColor Green
    Write-Host "  Discarded: $($responseObj.discarded)" -ForegroundColor Red
}
Write-Host "  Files in response: $($responseObj.files.Count)" -ForegroundColor White

# Cleanup
Write-Host ""
Write-Host "Cleaning up test files..." -ForegroundColor Yellow
foreach ($file in $testFiles) {
    Remove-Item $file -ErrorAction SilentlyContinue
}

Write-Host "Test completed!" -ForegroundColor Cyan
