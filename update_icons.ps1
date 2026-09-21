Add-Type -AssemblyName System.Drawing

$srcIcon = [System.Drawing.Image]::FromFile("$PWD\index-512.png")
$srcLogo = [System.Drawing.Image]::FromFile("$PWD\logo.png")

function Save-ResizedImage {
    param($src, $w, $h, $outPath)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($src, 0, 0, $w, $h)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Save-Foreground {
    param($src, $totalSize, $logoSize, $outPath)
    $bmp = New-Object System.Drawing.Bitmap($totalSize, $totalSize)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $offset = [int](($totalSize - $logoSize) / 2)
    $g.DrawImage($src, $offset, $offset, $logoSize, $logoSize)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

function Save-Splash {
    param($src, $targetW, $targetH, $outPath)
    $bmp = New-Object System.Drawing.Bitmap($targetW, $targetH)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::White)
    
    # logo size is about 40% of the smaller dimension
    $minDim = [Math]::Min($targetW, $targetH)
    $logoSize = [int]($minDim * 0.45)
    $x = [int](($targetW - $logoSize) / 2)
    $y = [int](($targetH - $logoSize) / 2)
    
    $g.DrawImage($src, $x, $y, $logoSize, $logoSize)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# 1. Update Launcher Icons
$densities = @(
    @{ Name="mdpi"; Size=48; FgTotal=108; FgLogo=72 },
    @{ Name="hdpi"; Size=72; FgTotal=162; FgLogo=108 },
    @{ Name="xhdpi"; Size=96; FgTotal=216; FgLogo=144 },
    @{ Name="xxhdpi"; Size=144; FgTotal=324; FgLogo=216 },
    @{ Name="xxxhdpi"; Size=192; FgTotal=432; FgLogo=288 }
)

foreach ($d in $densities) {
    $dir = "$PWD\android\app\src\main\res\mipmap-$($d.Name)"
    if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force }
    
    # Save standard & round launcher icon
    Save-ResizedImage $srcIcon $d.Size $d.Size "$dir\ic_launcher.png"
    Save-ResizedImage $srcIcon $d.Size $d.Size "$dir\ic_launcher_round.png"
    
    # Save adaptive foreground
    Save-Foreground $srcLogo $d.FgTotal $d.FgLogo "$dir\ic_launcher_foreground.png"
    Write-Output "Updated mipmap-$($d.Name)"
}

# 2. Update Splash Screens
$splashes = @(
    @{ Dir="drawable"; W=480; H=800 },
    @{ Dir="drawable-port-mdpi"; W=320; H=480 },
    @{ Dir="drawable-port-hdpi"; W=480; H=800 },
    @{ Dir="drawable-port-xhdpi"; W=720; H=1280 },
    @{ Dir="drawable-port-xxhdpi"; W=960; H=1600 },
    @{ Dir="drawable-port-xxxhdpi"; W=1280; H=1920 },
    @{ Dir="drawable-land-mdpi"; W=480; H=320 },
    @{ Dir="drawable-land-hdpi"; W=800; H=480 },
    @{ Dir="drawable-land-xhdpi"; W=1280; H=720 },
    @{ Dir="drawable-land-xxhdpi"; W=1600; H=960 },
    @{ Dir="drawable-land-xxxhdpi"; W=1920; H=1280 }
)

foreach ($s in $splashes) {
    $dir = "$PWD\android\app\src\main\res\$($s.Dir)"
    if (Test-Path $dir) {
        Save-Splash $srcLogo $s.W $s.H "$dir\splash.png"
        Write-Output "Updated splash in $($s.Dir)"
    }
}

$srcIcon.Dispose()
$srcLogo.Dispose()
Write-Output "All icons and splash screens successfully replaced!"
