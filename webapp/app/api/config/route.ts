import { NextResponse } from "next/server";
import { writeFileSync, readFileSync } from "fs";
import { join } from "path";

// Chemin vers le fichier .env du backend
const ENV_PATH = join(process.cwd(), "..", ".env");

export async function GET() {
  try {
    const envContent = readFileSync(ENV_PATH, "utf-8");
    const config: Record<string, string> = {};
    
    // Parser le fichier .env
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        config[key.trim()] = valueParts.join("=").trim();
      }
    });

    return NextResponse.json({
      organizationName: config.AVA_NAME || "",
      adminEmail: config.SUMMARY_EMAIL || "",
      timezone: "Europe/Paris",
      language: config.AVA_LANGUAGE || "fr-FR",
      persona: "secretary",
      tone: "warm",
      jobDescription: "",
      guidelines: config.AVA_SYSTEM_PROMPT || "",
      phoneNumber: config.TWILIO_PHONE_NUMBER || "",
      businessHours: "09:00-18:00",
      fallbackEmail: config.SUMMARY_EMAIL || "",
      summaryEmail: config.SUMMARY_EMAIL || "",
      smtpServer: config.SMTP_SERVER || "",
      smtpPort: config.SMTP_PORT || "587",
      smtpUsername: config.SMTP_USERNAME || "",
      smtpPassword: config.SMTP_PASSWORD || "",
    });
  } catch (error) {
    console.error("Error reading config:", error);
    return NextResponse.json(
      { error: "Failed to read configuration" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Lire le fichier .env actuel
    let envContent = "";
    try {
      envContent = readFileSync(ENV_PATH, "utf-8");
    } catch {
      // Si le fichier n'existe pas, on part d'un template vide
      envContent = "";
    }

    // Fonction pour mettre à jour ou ajouter une variable
    const updateEnvVar = (key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    };

    // Mettre à jour les variables d'environnement
    if (data.organizationName) updateEnvVar("AVA_NAME", data.organizationName);
    if (data.adminEmail) updateEnvVar("SUMMARY_EMAIL", data.adminEmail);
    if (data.language) updateEnvVar("AVA_LANGUAGE", data.language);
    if (data.guidelines) updateEnvVar("AVA_SYSTEM_PROMPT", data.guidelines);
    if (data.phoneNumber) updateEnvVar("TWILIO_PHONE_NUMBER", data.phoneNumber);
    if (data.summaryEmail) updateEnvVar("SUMMARY_EMAIL", data.summaryEmail);
    if (data.smtpServer) updateEnvVar("SMTP_SERVER", data.smtpServer);
    if (data.smtpPort) updateEnvVar("SMTP_PORT", data.smtpPort);
    if (data.smtpUsername) updateEnvVar("SMTP_USERNAME", data.smtpUsername);
    if (data.smtpPassword) updateEnvVar("SMTP_PASSWORD", data.smtpPassword);

    // Sauvegarder le fichier .env
    writeFileSync(ENV_PATH, envContent.trim() + "\n");

    return NextResponse.json({ success: true, message: "Configuration saved successfully" });
  } catch (error) {
    console.error("Error saving config:", error);
    return NextResponse.json(
      { error: "Failed to save configuration" },
      { status: 500 }
    );
  }
}
