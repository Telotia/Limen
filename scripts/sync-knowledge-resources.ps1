param(
  [string]$ArtRoot = 'C:\Users\whyke\Nextcloud\Library\knowledge\art',
  [string]$NewsRoot = 'C:\Users\whyke\Nextcloud\Library\knowledge\finance',
  [string]$RepoRoot = (Split-Path -Parent $PSScriptRoot)
)

$ErrorActionPreference = 'Stop'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$culture = [System.Globalization.CultureInfo]::GetCultureInfo('en-CA')
$imageTool = Join-Path $PSScriptRoot 'resize-resource-image.py'
$python = (Get-Command python -ErrorAction Stop).Source

function Convert-ToWebJpeg {
  param(
    [Parameter(Mandatory)][string]$Source,
    [Parameter(Mandatory)][string]$Destination,
    [int]$MaxWidth = 1400,
    [int]$Quality = 84,
    [long]$MaxBytes = 2097152
  )

  $sourceInfo = Get-Item -LiteralPath $Source
  if (Test-Path -LiteralPath $Destination) {
    $destinationInfo = Get-Item -LiteralPath $Destination
    if (
      $destinationInfo.LastWriteTimeUtc -ge $sourceInfo.LastWriteTimeUtc -and
      $destinationInfo.Length -gt 1024 -and
      $destinationInfo.Length -le $MaxBytes
    ) { return }
  }

  $destinationDirectory = Split-Path -Parent $Destination
  New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null

  & $python $imageTool $Source $Destination --max-width $MaxWidth --quality $Quality
  if ($LASTEXITCODE -ne 0) {
    throw "Image conversion failed: $Source"
  }

  $outputInfo = Get-Item -LiteralPath $Destination
  if ($outputInfo.Length -le 1024) {
    throw "Image conversion produced an invalid file: $Destination"
  }

  $outputInfo.LastWriteTimeUtc = $sourceInfo.LastWriteTimeUtc
}

function Get-HtmlTitle {
  param([Parameter(Mandatory)][string]$Path)
  $html = [System.IO.File]::ReadAllText($Path, $utf8)
  $match = [regex]::Match($html, '<title>(.*?)</title>', 'IgnoreCase,Singleline')
  if (-not $match.Success) { return $null }
  $title = [System.Net.WebUtility]::HtmlDecode($match.Groups[1].Value).Trim()
  if (
    $title.IndexOf([char]0x00C3) -ge 0 -or
    $title.IndexOf([char]0x00C2) -ge 0 -or
    $title.IndexOf([char]0x00E2) -ge 0
  ) {
    $latin1 = [System.Text.Encoding]::GetEncoding(28591)
    $title = [System.Text.Encoding]::UTF8.GetString($latin1.GetBytes($title))
  }
  $middleDot = [char]0x00B7
  $emDash = [char]0x2014
  $enDash = [char]0x2013
  $title = $title -replace "^(Art|Finance)\s*[$middleDot|:]\s*", ''
  $title = $title -replace "[$emDash$enDash]", " $middleDot "
  $title = $title -replace "\s*$middleDot\s*\d{4}-\d{2}-\d{2}\s*$", ''
  $title = $title -replace "\s*$middleDot\s*Finance\s*$", ''
  return ($title -replace '\s+', ' ').Trim()
}

function Get-ResourceFolders {
  param([Parameter(Mandatory)][string]$Root)
  $yearRoot = Join-Path $Root '2026'
  if (-not (Test-Path -LiteralPath $yearRoot)) { return @() }

  return Get-ChildItem -LiteralPath $yearRoot -Directory | ForEach-Object {
    $year = Split-Path $_.Parent -Leaf
    $month = $_.Name
    Get-ChildItem -LiteralPath $_.FullName -Directory | ForEach-Object {
      $day = $_.Name
      Get-ChildItem -LiteralPath $_.FullName -Directory | ForEach-Object {
        [pscustomobject]@{
          Year = $year
          Month = $month
          Day = $day
          Slug = $_.Name
          Source = $_.FullName
        }
      }
    }
  }
}

function Sync-Collection {
  param(
    [Parameter(Mandatory)][ValidateSet('art', 'news')][string]$Kind,
    [Parameter(Mandatory)][string]$Root
  )

  $entries = @()
  foreach ($folder in (Get-ResourceFolders -Root $Root)) {
    $englishHtml = Join-Path $folder.Source 'en\index.html'
    if (-not (Test-Path -LiteralPath $englishHtml)) { continue }

    $dateText = "$($folder.Year)-$($folder.Month)-$($folder.Day)"
    $date = [datetime]::ParseExact($dateText, 'yyyy-MM-dd', $culture)
    $relativeFolder = "$($folder.Year)/$($folder.Month)/$($folder.Day)/$($folder.Slug)"
    $destination = Join-Path $RepoRoot "public\resource\$Kind\$($folder.Year)\$($folder.Month)\$($folder.Day)\$($folder.Slug)"
    New-Item -ItemType Directory -Force -Path $destination | Out-Null

    foreach ($language in @('en', 'zh')) {
      $sourceHtml = Join-Path $folder.Source "$language\index.html"
      if (Test-Path -LiteralPath $sourceHtml) {
        $languageDestination = Join-Path $destination $language
        New-Item -ItemType Directory -Force -Path $languageDestination | Out-Null
        $destinationHtml = Join-Path $languageDestination 'index.html'
        if ($Kind -eq 'news') {
          $html = [System.IO.File]::ReadAllText($sourceHtml, $utf8)
          $html = $html.Replace('<title>Finance', '<title>News')
          $html = $html.Replace('<div class="brand">Finance</div>', '<div class="brand">News</div>')
          [System.IO.File]::WriteAllText($destinationHtml, $html, $utf8)
        } else {
          Copy-Item -LiteralPath $sourceHtml -Destination $destinationHtml -Force
        }
      }
    }

    if ($Kind -eq 'art') {
      $sourceImage = Join-Path $folder.Source 'source.jpg'
      if (Test-Path -LiteralPath $sourceImage) {
        Convert-ToWebJpeg -Source $sourceImage -Destination (Join-Path $destination 'source.jpg') -MaxWidth 1800 -Quality 86 -MaxBytes 3145728
        Convert-ToWebJpeg -Source $sourceImage -Destination (Join-Path $destination 'cover.jpg') -MaxWidth 960 -Quality 80 -MaxBytes 1310720
      }
    } else {
      $sourceImage = Join-Path $folder.Source 'en\card-1.png'
      if (Test-Path -LiteralPath $sourceImage) {
        Convert-ToWebJpeg -Source $sourceImage -Destination (Join-Path $destination 'cover.jpg') -MaxWidth 960 -Quality 82 -MaxBytes 1310720
      }
    }

    $title = Get-HtmlTitle -Path $englishHtml
    if (-not $title) {
      $title = ($folder.Slug -split '-') | ForEach-Object {
        if ($_.Length -gt 0) { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
      }
      $title = $title -join ' '
    }

    $entries += [pscustomobject][ordered]@{
      kind = $Kind
      title = $title
      date = $dateText
      dateLabel = $date.ToString('MMM d, yyyy', $culture)
      folderLabel = $relativeFolder
      href = "/resource/$Kind/$relativeFolder/en/index.html"
      zhHref = "/resource/$Kind/$relativeFolder/zh/index.html"
      image = "/resource/$Kind/$relativeFolder/cover.jpg"
    }
  }
  return $entries
}

$catalog = @()
$catalog += Sync-Collection -Kind art -Root $ArtRoot
$catalog += Sync-Collection -Kind news -Root $NewsRoot
$catalog = $catalog | Sort-Object { $_.date }, { $_.title } -Descending

$catalogPath = Join-Path $RepoRoot 'src\data\resource-catalog.json'
$catalogJson = $catalog | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($catalogPath, $catalogJson + [Environment]::NewLine, $utf8)

$artCount = @($catalog | Where-Object kind -eq 'art').Count
$newsCount = @($catalog | Where-Object kind -eq 'news').Count
Write-Output "Synced $artCount Art entries and $newsCount News entries."
Write-Output "Catalog: $catalogPath"
