# Maintenance Mail Web App

Diese Web-Anwendung ersetzt die ursprüngliche C# WPF App. Sie ermöglicht das Parsen von ZF-Wartungslisten aus Excel-Dateien und das Generieren von formatierten HTML-E-Mails.

## Features
- **Modernes UI**: Basierend auf React, Tailwind CSS und Lucide Icons.
- **Excel Parsing**: Drag & Drop Upload von `.xlsx` Dateien.
- **Live-Vorschau**: Direktes Ansehen der generierten E-Mail im Browser.
- **Copy & Download**: E-Mail als HTML kopieren oder als Datei herunterladen.
- **OpenShift Ready**: Optimiert für Container-Umgebungen (Rootless Nginx).

## Lokale Entwicklung
1. In den Ordner `web-app` wechseln.
2. `npm install`
3. `npm run dev` (Öffnet die App unter http://localhost:3000)

## Build & Docker
### Lokal bauen
```bash
npm run build
```

### Docker Image erstellen
```bash
docker build -t maintenance-mailer .
```

### Docker Container testen
```bash
docker run -p 8080:8080 maintenance-mailer
```

## OpenShift Deployment
Die Anwendung nutzt Port **8080** und läuft unter einem **Non-Root User (101)**, was sie kompatibel mit Standard-OpenShift-Sicherheitsrichtlinien macht.
