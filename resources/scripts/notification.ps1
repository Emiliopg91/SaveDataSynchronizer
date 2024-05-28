$xml = "<toast><visual><binding template='ToastImageAndText02'><image id='1' src='$iconPath'/><text id='1'>$title</text><text id='2'>$message</text></binding></visual>${action}</toast>"
$XmlDocument = [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime]::New()
$XmlDocument.loadXml($xml)
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime]::CreateToastNotifier('SaveData Sync').Show($XmlDocument)