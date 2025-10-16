import 'dotenv/config';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import API handler (need to use dynamic import for ES modules)
let handleAPI;
const loadAPIHandler = async () => {
  try {
    const apiModule = await import('./server/api.js');
    handleAPI = apiModule.handleAPI;
    console.log('✅ API handler loaded successfully');
  } catch (error) {
    console.warn('⚠️ API handler not available:', error.message);
    handleAPI = null;
  }
};

// Load API handler on startup
loadAPIHandler();

const PORT = 5000;
const HOST = '0.0.0.0';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.txt': 'text/plain'
};

const server = http.createServer(async (req, res) => {
  // Check if this is an API request
  if (req.url.startsWith('/api/')) {
    if (handleAPI) {
      await handleAPI(req, res);
      return;
    } else {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API service unavailable' }));
      return;
    }
  }

  // Only allow GET and HEAD methods for static content
  if (!['GET', 'HEAD'].includes(req.method) && req.method !== 'OPTIONS') {
    res.writeHead(405, { 'Content-Type': 'text/plain' });
    res.end('Method Not Allowed');
    return;
  }
  
  // Parse URL and handle query parameters
  const rawPathname = req.url.split('?')[0];
  
  // Decode URI and normalize path to prevent directory traversal
  let pathname;
  try {
    pathname = decodeURIComponent(rawPathname || '/');
  } catch (err) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }
  
  // Default to index.html for root path
  if (pathname === '/') {
    pathname = 'index.html';
  } else {
    // Remove leading slashes and normalize
    pathname = pathname.replace(/^\/+/, '');
  }
  
  // Construct file path safely within the public directory
  const publicDir = __dirname;
  const safePath = path.normalize(path.join(publicDir, pathname));
  
  // Ensure the resolved path is within the public directory (prevent directory traversal)
  if (!safePath.startsWith(publicDir + path.sep) && safePath !== publicDir) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    console.log(`403: Directory traversal attempt blocked: ${pathname}`);
    return;
  }
  
  const filePath = safePath;
  
  // Get file extension for MIME type
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  // Set CORS headers to allow all origins (important for Replit iframe)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Allow camera access for QR scanning in iframe
  res.setHeader('Permissions-Policy', 'camera=*, microphone=()');
  
  // Disable caching for development (critical for Replit)
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
      console.log(`404: ${pathname} not found`);
      return;
    }
    
    // Read and serve the file
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end('<h1>500 - Internal Server Error</h1>');
        console.error(`Error reading file ${pathname}:`, err);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      console.log(`Served: ${pathname} (${contentType})`);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 SaveUp Mobile App server running at http://${HOST}:${PORT}`);
  console.log(`📱 Visit the mobile app interface to get started`);
  console.log(`🔧 Cache disabled for development - changes will appear immediately`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed.');
    process.exit(0);
  });
});