# Diagnostic script to check API server status
# check_server.ps1

Write-Host "🔍 Fitness Tracker API Diagnostics" -ForegroundColor Cyan
Write-Host "=" * 40 -ForegroundColor Cyan

# Check if port 5000 is in use
Write-Host "1. Checking if port 5000 is in use..." -ForegroundColor Yellow
$portCheck = netstat -an | findstr ":5000"
if ($portCheck) {
    Write-Host "✅ Port 5000 is in use:" -ForegroundColor Green
    Write-Host $portCheck -ForegroundColor White
} else {
    Write-Host "❌ Port 5000 is not in use - API server may not be running" -ForegroundColor Red
}

Write-Host ""

# Try to connect to the base URL
Write-Host "2. Testing base URL connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -Method GET -TimeoutSec 5
    Write-Host "✅ Base URL accessible, Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Cannot connect to base URL: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Try health endpoint
Write-Host "3. Testing health endpoint..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Health endpoint accessible, Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Health endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# List all available endpoints
Write-Host "4. Testing available endpoints..." -ForegroundColor Yellow
$endpoints = @(
    @{Method="GET"; Url="http://localhost:5000/"},
    @{Method="GET"; Url="http://localhost:5000/health"},
    @{Method="POST"; Url="http://localhost:5000/predict"}
)

foreach ($endpoint in $endpoints) {
    try {
        if ($endpoint.Method -eq "GET") {
            $response = Invoke-WebRequest -Uri $endpoint.Url -Method GET -TimeoutSec 5
            Write-Host "✅ $($endpoint.Method) $($endpoint.Url) - Status: $($response.StatusCode)" -ForegroundColor Green
        } else {
            # For POST, just check if the endpoint exists (will get 400 for bad request, not 405 for method not allowed)
            $headers = @{"Content-Type" = "application/json"}
            $body = '{"test": "data"}'
            $response = Invoke-WebRequest -Uri $endpoint.Url -Method POST -Headers $headers -Body $body -TimeoutSec 5
            Write-Host "✅ $($endpoint.Method) $($endpoint.Url) - Status: $($response.StatusCode)" -ForegroundColor Green
        }
    } catch {
        if ($_.Exception.Message -match "405") {
            Write-Host "❌ $($endpoint.Method) $($endpoint.Url) - Method Not Allowed (405)" -ForegroundColor Red
        } elseif ($_.Exception.Message -match "400") {
            Write-Host "✅ $($endpoint.Method) $($endpoint.Url) - Endpoint exists (400 Bad Request expected)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($endpoint.Method) $($endpoint.Url) - Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "🛠️  Troubleshooting Steps:" -ForegroundColor Cyan
Write-Host "1. Make sure the API server is running:" -ForegroundColor Yellow
Write-Host "   python fitness_predictor_api.py" -ForegroundColor White
Write-Host "2. Check the server output for any errors" -ForegroundColor Yellow
Write-Host "3. Try using the production API instead:" -ForegroundColor Yellow
Write-Host "   python fitness_predictor_api_production.py" -ForegroundColor White
