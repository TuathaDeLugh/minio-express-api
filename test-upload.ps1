# Upload API Test Script

Write-Host "=== Testing Upload API ===" -ForegroundColor Cyan
Write-Host ""

# Create a test file
$testFile = "test-upload-file.txt"
"This is a test file for upload API testing" | Out-File -FilePath $testFile -Encoding UTF8

# Test 1: Upload with randomization (default)
Write-Host "Test 1: Upload with randomization (default)" -ForegroundColor Yellow
$response1 = curl.exe -X POST http://localhost:4000/upload `
  -F "files=@$testFile" `
  -F "bucket=testing" `
  -s

Write-Host "Response:" -ForegroundColor Green
$response1 | ConvertFrom-Json | ConvertTo-Json -Depth 10
Write-Host ""

# Test 2: Upload with randomName=false (preserve original name)
Write-Host "Test 2: Upload with randomName=false (preserve original)" -ForegroundColor Yellow
$response2 = curl.exe -X POST http://localhost:4000/upload `
  -F "files=@$testFile" `
  -F "bucket=testing" `
  -F "randomName=false" `
  -s

Write-Host "Response:" -ForegroundColor Green
$response2 | ConvertFrom-Json | ConvertTo-Json -Depth 10
Write-Host ""

# Test 3: Get files list
Write-Host "Test 3: Get files list (showing last 3 files)" -ForegroundColor Yellow
$response3 = curl.exe -s http://localhost:4000/files?bucket=testing
$filesData = $response3 | ConvertFrom-Json
Write-Host "Total files: $($filesData.count)" -ForegroundColor Green
Write-Host "Last 3 files:" -ForegroundColor Green
$filesData.files | Select-Object -Last 3 | ConvertTo-Json -Depth 10
Write-Host ""

# Cleanup
Remove-Item $testFile -ErrorAction SilentlyContinue
Write-Host "Test completed!" -ForegroundColor Cyan
