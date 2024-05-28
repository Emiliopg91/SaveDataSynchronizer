[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing') | Out-Null
[System.Drawing.Icon]::ExtractAssociatedIcon($exeFile).ToBitmap().Save($iconFile)