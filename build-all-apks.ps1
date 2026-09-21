# Build all 4 APKs for v2.4.1 with individual Icons, Labels, and URLs
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "C:\Users\DELL\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

Write-Host "Verifying Java..." -ForegroundColor Cyan
& java -version

$projectDir = "C:\Users\DELL\OneDrive\Desktop\RIDE-SATHI"
Set-Location $projectDir

$manifestPath = Join-Path $projectDir "android\app\src\main\AndroidManifest.xml"
$apkOutputDir = "C:\Users\DELL\ridesathi_build\app\outputs\apk\debug"
$releaseOutputDir = "C:\Users\DELL\ridesathi_build\app\outputs\apk\release"
$outputDir = Join-Path $projectDir "release_v2.4.1"

if (-not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

$targets = @(
    @{
        Name = "RideSathi-Customer-v2.4.1.apk"
        Url = "https://ride-sathi-go.web.app/index.html"
        Icon = "@mipmap/ic_customer"
        RoundIcon = "@mipmap/ic_customer_round"
        Label = "Ride Sathi - Customer"
    },
    @{
        Name = "RideSathi-Driver-v2.4.1.apk"
        Url = "https://ride-sathi-go.web.app/driver.html"
        Icon = "@mipmap/ic_driver"
        RoundIcon = "@mipmap/ic_driver_round"
        Label = "Ride Sathi - Driver"
    },
    @{
        Name = "RideSathi-Admin-v2.4.1.apk"
        Url = "https://ride-sathi-go.web.app/admin.html"
        Icon = "@mipmap/ic_admin"
        RoundIcon = "@mipmap/ic_admin_round"
        Label = "Ride Sathi - Admin"
    },
    @{
        Name = "RideSathi-Registration-v2.4.1.apk"
        Url = "https://ride-sathi-go.web.app/driver-registration.html"
        Icon = "@mipmap/ic_registration"
        RoundIcon = "@mipmap/ic_registration_round"
        Label = "Ride Sathi - Registration"
    }
)

$utf8NoBom = New-Object System.Text.UTF8Encoding $false

foreach ($t in $targets) {
    Write-Host "`n==================================================" -ForegroundColor Yellow
    Write-Host "Configuring and Building: $($t.Name)" -ForegroundColor Yellow
    Write-Host "  Label: $($t.Label)" -ForegroundColor Yellow
    Write-Host "  Icon:  $($t.Icon)" -ForegroundColor Yellow
    Write-Host "  URL:   $($t.Url)" -ForegroundColor Yellow
    Write-Host "==================================================" -ForegroundColor Yellow

    # Update Manifest with Icon, RoundIcon, Label, and START_URL
    $manifestContent = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8)
    $manifestContent = [regex]::Replace($manifestContent, 'android:icon="[^"]+"', "android:icon=`"$($t.Icon)`"")
    $manifestContent = [regex]::Replace($manifestContent, 'android:roundIcon="[^"]+"', "android:roundIcon=`"$($t.RoundIcon)`"")
    $manifestContent = [regex]::Replace($manifestContent, 'android:label="[^"]+"', "android:label=`"$($t.Label)`"")
    $manifestContent = [regex]::Replace($manifestContent, '<meta-data android:name="START_URL" android:value="[^"]*" />', "<meta-data android:name=`"START_URL`" android:value=`"$($t.Url)`" />")
    [System.IO.File]::WriteAllText($manifestPath, $manifestContent, $utf8NoBom)

    # Delete previous output apk if present
    $builtApk = Join-Path $apkOutputDir "app-debug.apk"
    if (Test-Path $builtApk) {
        Remove-Item -Path $builtApk -Force
    }

    # Clean & assembleDebug
    Write-Host "Running Gradle clean assembleDebug..." -ForegroundColor Cyan
    & ".\android\gradlew.bat" -p android clean assembleDebug
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

    # If it is Registration, also provide RideSathi-Driver-Registration-v2.4.1.apk
    if ($t.Name -eq "RideSathi-Registration-v2.4.1.apk") {
        Copy-Item $builtApk (Join-Path $projectDir "RideSathi-Driver-Registration-v2.4.1.apk") -Force
        Copy-Item $builtApk (Join-Path $outputDir "RideSathi-Driver-Registration-v2.4.1.apk") -Force
    }

    $sizeMb = [math]::Round((Get-Item $rootDest).Length / 1MB, 2)
    Write-Host "Successfully generated $($t.Name) ($sizeMb MB)" -ForegroundColor Green
}

# Reset manifest to default Customer configuration
Write-Host "`nRestoring AndroidManifest.xml to default Customer settings..." -ForegroundColor Cyan
$cust = $targets[0]
$manifestContent = [System.IO.File]::ReadAllText($manifestPath, [System.Text.Encoding]::UTF8)
$manifestContent = [regex]::Replace($manifestContent, 'android:icon="[^"]+"', "android:icon=`"$($cust.Icon)`"")
$manifestContent = [regex]::Replace($manifestContent, 'android:roundIcon="[^"]+"', "android:roundIcon=`"$($cust.RoundIcon)`"")
$manifestContent = [regex]::Replace($manifestContent, 'android:label="[^"]+"', "android:label=`"$($cust.Label)`"")
$manifestContent = [regex]::Replace($manifestContent, '<meta-data android:name="START_URL" android:value="[^"]*" />', "<meta-data android:name=`"START_URL`" android:value=`"$($cust.Url)`" />")
[System.IO.File]::WriteAllText($manifestPath, $manifestContent, $utf8NoBom)

# Build standard app-debug.apk and app-release.apk
& ".\android\gradlew.bat" -p android assembleDebug
$builtDebug = Join-Path $apkOutputDir "app-debug.apk"
Copy-Item $builtDebug (Join-Path $projectDir "app-debug.apk") -Force
Copy-Item $builtDebug (Join-Path $outputDir "app-debug.apk") -Force

Write-Host "Building master app-release.apk..." -ForegroundColor Cyan
& ".\android\gradlew.bat" -p android assembleRelease
$builtRelease = Join-Path $releaseOutputDir "app-release.apk"
if (Test-Path $builtRelease) {
    Copy-Item $builtRelease (Join-Path $projectDir "app-release.apk") -Force
    Copy-Item $builtRelease (Join-Path $outputDir "app-release.apk") -Force
}

Write-Host "`nAll 4 Role APKs + Master APKs built successfully for v2.4.1!" -ForegroundColor Green
Get-ChildItem -Path $outputDir -Filter "*.apk" | Select-Object Name, Length, LastWriteTime
