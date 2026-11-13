// Zero-dependency static server. Run: npm start  ->  http://localhost:3000
const http = require("http"), fs = require("fs"), path = require("path");
const root = __dirname;
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".csv": "text/csv" };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p === "/") p = "/public/index.html";
  else if (!p.startsWith("/data/")) p = "/public" + p;
  const file = path.normalize(path.join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end("Not found"); }
    res.writeHead(200, { "Content-Type": types[path.extname(file)] || "text/plain" });
    res.end(buf);
  });
}).listen(process.env.PORT || 3000, () => console.log("Open http://localhost:" + (process.env.PORT || 3000)));
