import { NextResponse } from "next/server";
import { spawn, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Store the backend and ngrok processes globally (in production, use Redis or similar)
let backendProcess: any = null;
let ngrokProcess: any = null;

export async function GET() {
  try {
    // Check if backend is running on port 8081
    const { stdout } = await execAsync("lsof -i:8081 -t");
    const isRunning = stdout.trim().length > 0;
    
    return NextResponse.json({ 
      status: isRunning ? "running" : "stopped",
      port: 8081,
      url: "http://localhost:8081"
    });
  } catch (error) {
    // No process found on port 8081
    return NextResponse.json({ 
      status: "stopped",
      port: 8081,
      url: "http://localhost:8081"
    });
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json();
    
    if (action === "start") {
      // Check if already running
      try {
        const { stdout } = await execAsync("lsof -i:8081 -t");
        if (stdout.trim().length > 0) {
          return NextResponse.json({ 
            success: false, 
            message: "Backend déjà en cours d'exécution" 
          });
        }
      } catch {
        // Port is free, continue
      }

      // Start the backend - CHEMIN CORRIGÉ
      const backendPath = process.cwd().includes("/webapp") 
        ? process.cwd().replace("/webapp", "") 
        : process.cwd();
      
      console.log("🚀 Starting backend from:", backendPath);
      
      // Utiliser uvicorn du venv
      const uvicornPath = `${backendPath}/venv/bin/uvicorn`;
      const pythonCmd = spawn(uvicornPath, ["main:app", "--host", "0.0.0.0", "--port", "8081"], {
        cwd: backendPath,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      // Capturer les logs pour debug
      pythonCmd.stdout?.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
      });

      pythonCmd.stderr?.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
      });

      // Unref to allow the parent process to exit independently
      pythonCmd.unref();

      backendProcess = pythonCmd;

      // Démarrer ngrok en parallèle
      const ngrokCmd = spawn("/opt/homebrew/bin/ngrok", ["http", "8081"], {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      ngrokCmd.stdout?.on('data', (data) => {
        console.log(`Ngrok stdout: ${data}`);
      });

      ngrokCmd.stderr?.on('data', (data) => {
        console.error(`Ngrok stderr: ${data}`);
      });

      ngrokCmd.unref();

      ngrokProcess = ngrokCmd;

      // Wait for the server to start (plus long pour être sûr)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Vérifier que ça a bien démarré
      try {
        const { stdout } = await execAsync("lsof -i:8081 -t");
        if (stdout.trim().length > 0) {
          return NextResponse.json({ 
            success: true, 
            message: "✅ Backend + Ngrok démarrés avec succès !",
            pid: pythonCmd.pid,
            ngrokPid: ngrokCmd.pid
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            message: "❌ Le backend n'a pas démarré (port 8081 toujours libre)"
          });
        }
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: "❌ Erreur lors de la vérification du démarrage"
        });
      }
    }

    if (action === "stop") {
      try {
        // Kill backend process on port 8081
        await execAsync("lsof -ti:8081 | xargs kill -9");
        backendProcess = null;
        
        // Kill ngrok process
        await execAsync("pkill -f ngrok");
        ngrokProcess = null;
        
        return NextResponse.json({ 
          success: true, 
          message: "Backend + Ngrok arrêtés avec succès" 
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          message: "Aucun backend/ngrok en cours d'exécution" 
        });
      }
    }

    if (action === "restart") {
      // Stop first
      try {
        await execAsync("lsof -ti:8081 | xargs kill -9");
        await execAsync("pkill -f ngrok");
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch {
        // Already stopped
      }

      // Start - CHEMIN CORRIGÉ
      const backendPath = process.cwd().includes("/webapp") 
        ? process.cwd().replace("/webapp", "") 
        : process.cwd();
      
      console.log("🔄 Restarting backend + ngrok from:", backendPath);
      
      // Utiliser uvicorn du venv
      const uvicornPath = `${backendPath}/venv/bin/uvicorn`;
      const pythonCmd = spawn(uvicornPath, ["main:app", "--host", "0.0.0.0", "--port", "8081"], {
        cwd: backendPath,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      pythonCmd.stdout?.on('data', (data) => {
        console.log(`Backend stdout: ${data}`);
      });

      pythonCmd.stderr?.on('data', (data) => {
        console.error(`Backend stderr: ${data}`);
      });

      pythonCmd.unref();
      backendProcess = pythonCmd;

      // Redémarrer ngrok
      const ngrokCmd = spawn("/opt/homebrew/bin/ngrok", ["http", "8081"], {
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });

      ngrokCmd.stdout?.on('data', (data) => {
        console.log(`Ngrok stdout: ${data}`);
      });

      ngrokCmd.stderr?.on('data', (data) => {
        console.error(`Ngrok stderr: ${data}`);
      });

      ngrokCmd.unref();
      ngrokProcess = ngrokCmd;
      
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Vérifier que ça a bien redémarré
      try {
        const { stdout } = await execAsync("lsof -i:8081 -t");
        if (stdout.trim().length > 0) {
          return NextResponse.json({ 
            success: true, 
            message: "✅ Backend + Ngrok redémarrés avec succès !",
            pid: pythonCmd.pid,
            ngrokPid: ngrokCmd.pid
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            message: "❌ Le backend n'a pas redémarré"
          });
        }
      } catch {
        return NextResponse.json({ 
          success: false, 
          message: "❌ Erreur lors de la vérification du redémarrage"
        });
      }
    }

    return NextResponse.json({ 
      success: false, 
      message: "Action invalide" 
    }, { status: 400 });

  } catch (error) {
    console.error("Backend control error:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Erreur lors du contrôle du backend",
      error: String(error)
    }, { status: 500 });
  }
}
