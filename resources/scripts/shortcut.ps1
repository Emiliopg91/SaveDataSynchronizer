$WshShell = New-Object -comObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$home\Desktop\SaveDataSync.lnk")
$Shortcut.TargetPath=$runningBat
$Shortcut.IconLocation=$iconPath
$Shortcut.Save()