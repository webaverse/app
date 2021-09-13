const path = require('path');
const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const util = require('util');
const express = require('express');
const vite = require('vite');
const wsrtc = require('wsrtc/wsrtc-server.js');
const OpenAI = require('openai-api');
const GPT3Encoder = require('gpt-3-encoder');
let openAiKey = null;
try {
  const config = require('./config.json');
  openAiKey = config.openAiKey;
} catch(err) {
  console.warn(err);
}
if (!openAiKey) {
  throw new Error('fail');
}
const aiPrefix = fs.readFileSync('./ai/ai-prefix.js');
// const htmlRenderIframeString = fs.readFileSync('./html_render_iframe.html', 'utf8');

Error.stackTraceLimit = 300;

const _isMediaType = p => /\.(?:png|jpe?g|gif|glb|mp3)$/.test(p);
/* const fillTemplate = function(templateString, templateVars) {
  return new Function("return `"+templateString +"`;").call(templateVars);
}; */
OpenAI.prototype._send_request = (sendRequest => async function(url, method, opts = {}) {
  let camelToUnderscore = (key) => {
    let result = key.replace(/([A-Z])/g, " $1");
    return result.split(' ').join('_').toLowerCase();
  }
  
  // console.log('got req', url, method, opts);

  const data = {};
  for (const key in opts) {
    data[camelToUnderscore(key)] = opts[key];
  }

  const rs = await new Promise((accept, reject) => {
    const req = https.request(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this._api_key}`,
        'Content-Type': 'application/json'
      }
    }, res => {
      res.setEncoding('utf8');
      accept(res);
    });
    req.end(Object.keys(data).length ? JSON.stringify(data) : '');
    req.on('error', reject);
  });
  return rs;
})(OpenAI.prototype._send_request);
const openai = openAiKey && new OpenAI(openAiKey);
const _openAiCodex = async (prompt, stop) => {
  const maxTokens = 4096;
  const max_tokens = maxTokens - GPT3Encoder.encode(prompt).length;
  console.log('max tokens: ' + max_tokens);
  const gptRes = await openai.complete({
    engine: 'davinci-codex',
    prompt,
    stop,
    temperature: 0,
    topP: 1,
    max_tokens,
    stream: true,

    /* stream: false,
    prompt: o.prompt, // 'this is a test',
    maxTokens: o.maxTokens, // 5,
    temperature: o.temperature, // 0.9,
    topP: o.topP, // 1,
    presencePenalty: o.presencePenalty, // 0,
    frequencyPenalty: o.frequencyPenalty, // 0,
    bestOf: o.bestOf, // 1,
    n: o.n, // 1,
    stop: o.stop, // ['\n'] */
  });
  return gptRes;
};

(async () => {
  const app = express();
  app.use('*', async (req, res, next) => {
    const o = url.parse(req.originalUrl, true);
    if (/^\/(?:@proxy|public)\//.test(o.pathname) && o.search !== '?import') {
      const u = o.pathname
        .replace(/^\/@proxy\//, '')
        .replace(/^\/public/, '')
        .replace(/^(https?:\/(?!\/))/, '$1/');
      if (_isMediaType(o.pathname)) {
        res.redirect(u);
      } else {
        req.originalUrl = u;
        next();
      }
    /* } else if (o.pathname === '/html_render_iframe.html' && o.query.u) {
      const srcUrl = decodeURIComponent(o.query.u);
      const s = fillTemplate(htmlRenderIframeString, {
        srcUrl,
      });
      res.set('Content-Type', 'text/html');
      res.end(s); */
    } else if (!!openai && o.pathname === '/ai' && o.query.p) {
      const p = decodeURIComponent(o.query.p);
      const proxyRes = await _openAiCodex(aiPrefix + p + ' */\n', '\n/* Command: ');
      if (proxyRes.statusCode >= 200 && proxyRes.statusCode < 300) {
        for (const key in proxyRes.headers) {
          const value = proxyRes.headers[key];
          res.setHeader(key, value);
        }
        // console.log('render');
        proxyRes.pipe(res);
        /* proxyRes.on('data', d => {
          console.log('got data', d.toString('utf8'));
        }); */
      } else {
        proxyRes.setEncoding('utf8');
        proxyRes.on('data', s => {
          console.log(s);
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.end('data: [DONE]');
      }
    } else {
      next();
    }
  });

  const port = parseInt(process.env.PORT, 10) || 3000;
  const httpServer = http.createServer(app);
  const viteServer = await vite.createServer({
    server: {
      middlewareMode: 'html',
      hmr: {
        server: httpServer,
        port,
      },
    }
  });
  app.use(viteServer.middlewares);
  
  await new Promise((accept, reject) => {
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`  > Local: http://localhost:${port}/`);
      accept();
    });
  });
  
  const wsServer = http.createServer();
  wsrtc.bindServer(wsServer);
  const port2 = port + 1;
  await new Promise((accept, reject) => {
    wsServer.listen(port2, () => {
      console.log(`  > World: ws://localhost:${port2}/`)
    });
    wsServer.on('error', err => {
      console.warn(err.stack);
      process.exit(1);
    });
  });
})();