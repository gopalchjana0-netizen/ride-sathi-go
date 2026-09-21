# Build all 4 APKs for v2.4.0
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Users\DELL\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Verifying Java..." -ForegroundColor Cyan
& java -version

$projectDir = "C:\Users\DELL\OneDrive\Desktop\RIDE-SATHI"
Set-Location $projectDir

$manifestPath = Join-Path $projectDir "android\app\src\main\AndroidManifest.xml"
$apkOutputDir = Join-Path $projectDir "android\app\build\outputs\apk\debug"
$outputDir = Join-Path $projectDir "release_v2.4.0"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$targets = @(
    @{ Name = "RideSathi-Customer-v2.4.0.apk"; Url = "https://ride-sathi-go.web.app/index.html" },
    @{ Name = "RideSathi-Driver-v2.4.0.apk"; Url = "https://ride-sathi-go.web.app/driver.html" },
    @{ Name = "RideSathi-Admin-v2.4.0.apk"; Url = "https://ride-sathi-go.web.app/admin.html" },
    @{ Name = "RideSathi-Registration-v2.4.0.apk"; Url = "https://ride-sathi-go.web.app/driver-registration.html" }
)

foreach ($t in $targets) {
    Write-Host "`n=========================================" -ForegroundColor Yellow
    Write-Host "Building: $($t.Name) with URL: $($t.Url)" -ForegroundColor Yellow
    Write-Host "=========================================" -ForegroundColor Yellow

    # Update Manifest
    $manifestContent = Get-Content $manifestPath -Raw
    $newContent = [regex]::Replace($manifestContent, '<meta-data android:name="START_URL" android:value="[^"]*" />', "<meta-data android:name=`"START_URL`" android:value=`"$($t.Url)`" />")
    Set-Content -Path $manifestPath -Value $newContent -Encoding utf8

    # Delete previous output apk if present to ensure fresh build
    $builtApk = Join-Path $apkOutputDir "app-debug.apk"
    if (Test-Path $builtApk) {
        Remove-Item -Path $builtApk -Force
    }

    # Run Gradle assembleDebug with standard daemon
    Write-Host "Running Gradle assembleDebug..." -ForegroundColor Cyan
    & ".\android\gradlew.bat" -p android assembleDebug
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Gradle build failed for $($t.Name)"
        exit 1
    }

    if (-not (Test-Path $builtApk)) {
        Write-Error "Built APK not found at $builtApk"
        exit 1
    }

    # Copy to root and release dir
    $rootDest = Join-Path $projectDir $t.Name
    $releaseDest = Join-Path $outputDir $t.Name
    Copy-Item $builtApk $rootDest -Force
    Copy-Item $builtApk $releaseDest -Force

    # If it is Registration, also provide RideSathi-Driver-Registration-v2.4.0.apk for compatibility
    if ($t.Name -eq "RideSathi-Registration-v2.4.0.apk") {
        Copy-Item $builtApk (Join-Path $projectDir "RideSathi-Driver-Registration-v2.4.0.apk") -Force
        Copy-Item $builtApk (Join-Path $outputDir "RideSathi-Driver-Registration-v2.4.0.apk") -Force
    }

    $sizeMb = [math]::Round((Get-Item $rootDest).Length / 1MB, 2)
    Write-Host "Successfully generated $($t.Name) ($sizeMb MB)" -ForegroundColor Green
}

# Reset manifest to default index.html and build standard app-debug.apk
$manifestContent = Get-Content $manifestPath -Raw
$newContent = [regex]::Replace($manifestContent, '<meta-data android:name="START_URL" android:value="[^"]*" />', '<meta-data android:name="START_URL" android:value="https://ride-sathi-go.web.app/index.html" />')
Set-Content -Path $manifestPath -Value $newContent -Encoding utf8
& ".\android\gradlew.bat" -p android assembleDebug

$builtApk = Join-Path $apkOutputDir "app-debug.apk"
Copy-Item $builtApk (Join-Path $projectDir "app-debug.apk") -Force
Copy-Item $builtApk (Join-Path $outputDir "app-debug.apk") -Force

Write-Host "`nAll APKs built successfully for v2.4.0!" -ForegroundColor Green
Get-ChildItem -Path $outputDir -Filter "*.apk" | Select-Object Name, Length, LastWriteTime
