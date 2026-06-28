import http from 'http';
import server from './dist/server/server.js';

const handler = async (req, res) => {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost';
    const url = new URL(req.url, `${protocol}://${host}`);
    
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v);
        }
      }
    }

    const init = {
      method: req.method,
      headers,
    };

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // Very basic body parsing for testing
      init.body = null; 
    }

    const webRequest = new Request(url, init);
    const webResponse = await server.fetch(webRequest, process.env, {});
    
    res.statusCode = webResponse.status;
    webResponse.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    if (webResponse.body) {
      // Not a real ReadableStream but enough for a quick test
      const reader = webResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Error');
  }
};

const s = http.createServer(handler);
s.listen(3000, () => {
  console.log('Listening on 3000');
  
  // Make a test request
  http.get('http://localhost:3000/', (res) => {
    console.log(`Status: ${res.statusCode}`);
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('Response body:', data.slice(0, 100) + '...');
      process.exit(0);
    });
  });
});
