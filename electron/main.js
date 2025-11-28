const { app, BrowserWindow, shell, dialog } = require('electron');
const path = require('path');
const { spawn, fork } = require('child_process');
const http = require('http');
const fs = require('fs');

// Check if running in development or production
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;
let serverProcess;
const PORT = 8085;

// Wait for server to be ready
function waitForServer(url, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304 || res.statusCode === 404) {
          resolve();
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };
    
    const retry = () => {
      if (Date.now() - startTime > timeout) {
        reject(new Error('Server startup timeout'));
      } else {
        setTimeout(check, 500);
      }
    };
    
    check();
  });
}

// Start the Next.js server using Electron's built-in Node.js
function startServer() {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, the server is started by concurrently
      console.log('Development mode - server should already be running');
      waitForServer(`http://localhost:${PORT}`)
        .then(resolve)
        .catch(reject);
      return;
    }

    // In production, start the standalone server using Electron's Node
    const appPath = path.join(process.resourcesPath, 'app');
    const standalonePath = path.join(appPath, '.next', 'standalone');
    const serverFile = path.join(standalonePath, 'server.js');
    
    console.log('App path:', appPath);
    console.log('Standalone path:', standalonePath);
    console.log('Server file:', serverFile);
    
    // Check if server file exists
    if (!fs.existsSync(serverFile)) {
      console.error('Server file not found:', serverFile);
      // List what's actually in the resources
      try {
        console.log('Resources contents:', fs.readdirSync(process.resourcesPath));
        if (fs.existsSync(appPath)) {
          console.log('App contents:', fs.readdirSync(appPath));
        }
      } catch (e) {
        console.error('Error listing directories:', e);
      }
      reject(new Error(`Server file not found at ${serverFile}`));
      return;
    }

    // Use fork() which uses Electron's built-in Node.js
    // This doesn't require a system Node.js installation
    console.log('Starting server with fork()...');
    
    serverProcess = fork(serverFile, [], {
      cwd: standalonePath,
      env: { 
        ...process.env,
        NODE_ENV: 'production',
        PORT: PORT.toString(),
        HOSTNAME: 'localhost'
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server stdout: ${data}`);
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server stderr: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    serverProcess.on('exit', (code, signal) => {
      console.log(`Server exited with code ${code}, signal ${signal}`);
    });

    // Wait for server to be ready
    console.log('Waiting for server to be ready...');
    waitForServer(`http://localhost:${PORT}`)
      .then(() => {
        console.log('Server is ready!');
        resolve();
      })
      .catch(reject);
  });
}

// Create the main application window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: 'CosmosDB UI',
    icon: isDev 
      ? path.join(__dirname, '..', 'build', 'icon.icns')
      : path.join(process.resourcesPath, 'icon.icns'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    // Show standard title bar for better UX
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    show: false
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the app
  const url = `http://localhost:${PORT}`;
  console.log('Loading URL:', url);
  
  mainWindow.loadURL(url).catch((err) => {
    console.error('Failed to load URL:', err);
    dialog.showErrorBox(
      'Failed to Load',
      `Could not connect to the application server at ${url}. Please try restarting the app.`
    );
  });

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Show splash/loading screen
function showLoadingWindow() {
  const loadingWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  loadingWindow.loadURL(`data:text/html,
    <html>
      <head>
        <style>
          body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
            flex-direction: column;
            border-radius: 20px;
          }
          .logo {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #06b6d4, #2563eb);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
            box-shadow: 0 10px 40px rgba(6, 182, 212, 0.3);
          }
          .logo svg {
            width: 50px;
            height: 50px;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 10px;
            font-weight: 600;
          }
          .spinner {
            width: 30px;
            height: 30px;
            border: 3px solid rgba(255,255,255,0.2);
            border-top-color: #06b6d4;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-top: 20px;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          p {
            color: #94a3b8;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <ellipse cx="12" cy="5" rx="9" ry="3"/>
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
          </svg>
        </div>
        <h1>Cosmos UI</h1>
        <p>Starting application...</p>
        <div class="spinner"></div>
      </body>
    </html>
  `);

  return loadingWindow;
}

// App ready handler
app.whenReady().then(async () => {
  console.log('App is ready');
  console.log('Is packaged:', app.isPackaged);
  console.log('Is dev:', isDev);
  console.log('Resources path:', process.resourcesPath);
  
  // Show loading window
  const loadingWindow = showLoadingWindow();

  try {
    await startServer();
    loadingWindow.close();
    createWindow();
  } catch (error) {
    console.error('Failed to start:', error);
    loadingWindow.close();
    dialog.showErrorBox(
      'Startup Error',
      `Failed to start the application: ${error.message}\n\nPlease check the console for more details.`
    );
    app.quit();
  }
});

// Stop the server process
function stopServer() {
  if (serverProcess) {
    console.log('Stopping server process...');
    try {
      serverProcess.kill('SIGTERM');
      serverProcess = null;
    } catch (e) {
      console.error('Error stopping server:', e);
    }
  }
}

// Quit when all windows are closed - including on macOS
app.on('window-all-closed', () => {
  console.log('All windows closed, quitting app...');
  stopServer();
  app.quit();
});

// macOS: Re-create window when dock icon is clicked (only if app hasn't quit)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && !app.isQuitting) {
    createWindow();
  }
});

// Clean up on quit
app.on('before-quit', (event) => {
  console.log('App is quitting...');
  app.isQuitting = true;
  stopServer();
});

// Also handle will-quit to ensure cleanup
app.on('will-quit', () => {
  console.log('App will quit, final cleanup...');
  stopServer();
});

// Handle certificate errors (for development with self-signed certs)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (isDev) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});
