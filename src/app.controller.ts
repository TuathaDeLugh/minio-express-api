import { Controller, Get, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { ApiExcludeController } from "@nestjs/swagger";

@ApiExcludeController()
@Controller()
export class AppController {
  @Get()
  getHome(@Req() req: Request, @Res() res: Response) {
    const accepts = req.headers.accept || "";
    const format = req.query.format;

    const appMetadata = {
      name: "minio-express-api",
      title: "Sailorlabs Storage Bucket API",
      version: "1.0.0",
      description: "A production-ready NestJS microservice providing a secure and configurable REST API layer over MinIO Object Storage. It supports multi-file upload, object replacement, list queries, structured prefix/folder navigation, file proxy streaming, and bulk deletes.",
      author: "Umang Sailor",
      license: "MIT",
      features: [
        "Multi-stage optimized Docker builds with Alpine Linux",
        "Configurable file limit, file size, and bucket settings via environment variables",
        "Security-first execution using a non-root system user",
        "Built-in endpoint health indicators (MinIO client status check)",
        "Fully-typed NestJS structure with built-in class validations",
        "Protected Swagger OpenAPI interactive test dashboard"
      ],
      swaggerDocsUrl: "/api",
      healthCheckUrl: "/health",
      apis: [
        {
          path: "/upload",
          method: "POST",
          summary: "Upload Multiple Files",
          description: "Uploads multiple files concurrently to a specified MinIO bucket. Max file count is configurable via MAX_UPLOAD_FILES.",
          headers: {
            "Content-Type": "multipart/form-data"
          },
          bodyParams: [
            { name: "files", type: "file[] (binary)", required: true, description: "One or more files to upload." },
            { name: "bucket", type: "string", required: false, description: "Override target bucket. Fallback is BUCKET_NAME env." },
            { name: "folder", type: "string", required: false, description: "Subfolder path prefix inside the bucket." },
            { name: "randomName", type: "enum ('true' | 'false')", required: false, default: "true", description: "Generate a randomized UUID filename." }
          ],
          response: {
            status: 200,
            description: "Files uploaded successfully.",
            example: {
              success: true,
              message: "2 files uploaded successfully",
              files: [
                {
                  originalName: "invoice.pdf",
                  fileName: "8f6d2a4e-1234-5678-abcd-ef0123456789.pdf",
                  bucket: "testing",
                  path: "documents/8f6d2a4e-1234-5678-abcd-ef0123456789.pdf",
                  url: "http://localhost:4000/storage/testing/documents/8f6d2a4e-1234-5678-abcd-ef0123456789.pdf"
                }
              ]
            }
          },
          curl: `curl -X POST http://localhost:4000/upload \\\n  -F "files=@/path/to/file1.png" \\\n  -F "bucket=testing" \\\n  -F "folder=images" \\\n  -F "randomName=true"`,
          javascript: `const formData = new FormData();\nformData.append('files', fileInput.files[0]);\nformData.append('bucket', 'testing');\nformData.append('folder', 'images');\n\nfetch('http://localhost:4000/upload', {\n  method: 'POST',\n  body: formData\n})\n.then(res => res.json())\n.then(data => console.log(data));`
        },
        {
          path: "/upload",
          method: "PUT",
          summary: "Replace / Overwrite File",
          description: "Replaces or updates a single file inside the MinIO bucket. Overwrites if a file with the same path exists.",
          headers: {
            "Content-Type": "multipart/form-data"
          },
          bodyParams: [
            { name: "file", type: "file (binary)", required: true, description: "The replacement file." },
            { name: "name", type: "string", required: true, description: "Exact name of the target file to replace." },
            { name: "bucket", type: "string", required: false, description: "Target bucket name." },
            { name: "folder", type: "string", required: false, description: "Folder path inside the bucket." }
          ],
          response: {
            status: 200,
            description: "File replaced successfully.",
            example: {
              success: true,
              message: "File replaced successfully",
              file: {
                originalName: "new-logo.png",
                fileName: "logo.png",
                bucket: "testing",
                path: "assets/logo.png",
                url: "http://localhost:4000/storage/testing/assets/logo.png"
              }
            }
          },
          curl: `curl -X PUT http://localhost:4000/upload \\\n  -F "file=@/path/to/new-logo.png" \\\n  -F "name=logo.png" \\\n  -F "bucket=testing" \\\n  -F "folder=assets"`,
          javascript: `const formData = new FormData();\nformData.append('file', fileInput.files[0]);\nformData.append('name', 'logo.png');\nformData.append('bucket', 'testing');\n\nfetch('http://localhost:4000/upload', {\n  method: 'PUT',\n  body: formData\n})\n.then(res => res.json())\n.then(data => console.log(data));`
        },
        {
          path: "/files",
          method: "GET",
          summary: "List Files",
          description: "Queries the MinIO bucket and lists all files containing metadata (name, size, lastModified, etag). Supports prefix filtering.",
          queryParams: [
            { name: "bucket", type: "string", required: false, description: "Bucket name to list files from." },
            { name: "folder", type: "string", required: false, description: "Filter listing by folder prefix (e.g. 'documents/')." }
          ],
          response: {
            status: 200,
            description: "Returns an array of file records.",
            example: [
              {
                name: "documents/report.pdf",
                size: 452819,
                lastModified: "2026-06-06T08:30:15.000Z",
                etag: "b10a8db164e0754105b7a99be72e3fe5"
              }
            ]
          },
          curl: `curl "http://localhost:4000/files?bucket=testing&folder=documents"`,
          javascript: `fetch('http://localhost:4000/files?bucket=testing&folder=documents')\n  .then(res => res.json())\n  .then(data => console.log(data));`
        },
        {
          path: "/storage/:bucket/:name",
          method: "GET",
          summary: "Retrieve File Proxy",
          description: "Proxies the file download from the MinIO server, streaming the binary buffer directly to the client with inline content disposition headers.",
          urlParams: [
            { name: "bucket", type: "string", required: true, description: "Bucket name." },
            { name: "name", type: "string", required: true, description: "Full relative path/filename within the bucket (supports slashes)." }
          ],
          response: {
            status: 200,
            description: "Binary data stream matching the file's mimetype.",
            example: "Binary Stream (e.g., Image data, PDF file)"
          },
          curl: `curl http://localhost:4000/storage/testing/documents/report.pdf --output report.pdf`,
          javascript: `// Access via standard img src or file download:\nwindow.open('http://localhost:4000/storage/testing/documents/report.pdf');`
        },
        {
          path: "/files",
          method: "DELETE",
          summary: "Bulk Delete Files",
          description: "Deletes multiple files in a single API call.",
          headers: {
            "Content-Type": "application/json"
          },
          bodyParams: [
            { name: "names", type: "string[]", required: true, description: "List of full filenames/paths inside bucket to delete." },
            { name: "bucket", type: "string", required: false, description: "Bucket name containing the target files." },
            { name: "folder", type: "string", required: false, description: "Folder path inside bucket." }
          ],
          response: {
            status: 200,
            description: "Deletion complete.",
            example: {
              success: true,
              message: "Successfully deleted 2 files",
              deleted: ["documents/report.pdf", "documents/old.txt"]
            }
          },
          curl: `curl -X DELETE http://localhost:4000/files \\\n  -H "Content-Type: application/json" \\\n  -d '{"names": ["documents/report.pdf"], "bucket": "testing"}'`,
          javascript: `fetch('http://localhost:4000/files', {\n  method: 'DELETE',\n  headers: {\n    'Content-Type': 'application/json'\n  },\n  body: JSON.stringify({\n    names: ['documents/report.pdf'],\n    bucket: 'testing'\n  })\n})\n.then(res => res.json())\n.then(data => console.log(data));`
        },
        {
          path: "/health",
          method: "GET",
          summary: "Health Check",
          description: "Returns health indicator for both the NestJS API server and its connection to the remote MinIO storage provider.",
          response: {
            status: 200,
            description: "JSON status output.",
            example: {
              status: "healthy",
              timestamp: "2026-06-06T11:14:11.000Z",
              services: {
                api: { status: "up", message: "API is running" },
                minio: { status: "up", message: "MinIO connection successful", endpoint: "http://storage.umangsailor.com:443" }
              },
              message: "All services are operational"
            }
          },
          curl: `curl http://localhost:4000/health`,
          javascript: `fetch('http://localhost:4000/health')\n  .then(res => res.json())\n  .then(data => console.log(data));`
        }
      ]
    };

    if (accepts.includes("application/json") || format === "json") {
      res.setHeader("Content-Type", "application/json");
      return res.json(appMetadata);
    }

    const html = this.generateHtml(appMetadata);
    res.setHeader("Content-Type", "text/html");
    return res.send(html);
  }

  private generateHtml(meta: any): string {
    const apiCards = meta.apis.map((api: any, idx: number) => {
      const methodLower = api.method.toLowerCase();
      
      let paramsSection = "";
      
      if (api.urlParams && api.urlParams.length > 0) {
        paramsSection += `
          <div class="param-group">
            <h5>URL Parameters</h5>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${api.urlParams.map((p: any) => `
                  <tr>
                    <td><code>:${p.name}</code></td>
                    <td>${p.type}</td>
                    <td><span class="badge badge-required">${p.required ? "Yes" : "No"}</span></td>
                    <td>${p.description}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      if (api.queryParams && api.queryParams.length > 0) {
        paramsSection += `
          <div class="param-group">
            <h5>Query Parameters</h5>
            <table>
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${api.queryParams.map((p: any) => `
                  <tr>
                    <td><code>${p.name}</code></td>
                    <td>${p.type}</td>
                    <td><span class="badge ${p.required ? "badge-required" : "badge-optional"}">${p.required ? "Yes" : "No"}</span></td>
                    <td>${p.description}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      if (api.bodyParams && api.bodyParams.length > 0) {
        paramsSection += `
          <div class="param-group">
            <h5>Request Body Fields</h5>
            <table>
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${api.bodyParams.map((p: any) => `
                  <tr>
                    <td><code>${p.name}</code></td>
                    <td>${p.type}</td>
                    <td><span class="badge ${p.required ? "badge-required" : "badge-optional"}">${p.required ? "Yes" : "No"}</span></td>
                    <td>${p.description}${p.default ? ` (Default: <code>${p.default}</code>)` : ""}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `;
      }

      const responseString = typeof api.response.example === "object" 
        ? JSON.stringify(api.response.example, null, 2)
        : api.response.example;

      return `
        <div class="api-card">
          <div class="api-card-header">
            <div class="api-badge-route">
              <span class="method-badge method-${methodLower}">${api.method}</span>
              <span class="route-path">${api.path}</span>
            </div>
            <h3 class="api-summary">${api.summary}</h3>
          </div>
          <div class="api-card-content">
            <div class="api-info-pane">
              <p class="api-description">${api.description}</p>
              ${api.headers ? `<div class="headers-info"><strong>Headers:</strong> <code>Content-Type: ${api.headers["Content-Type"]}</code></div>` : ""}
              ${paramsSection}
            </div>
            <div class="api-snippet-pane">
              <div class="snippet-tabs">
                <button class="tab-btn active" onclick="switchTab(this, 'curl-${idx}')">cURL</button>
                <button class="tab-btn" onclick="switchTab(this, 'js-${idx}')">JavaScript</button>
                <button class="tab-btn" onclick="switchTab(this, 'response-${idx}')">Response (${api.response.status})</button>
              </div>
              <div class="snippet-contents">
                <div class="snippet-content active" id="curl-${idx}">
                  <pre><code class="language-bash">${this.escapeHtml(api.curl || "")}</code></pre>
                  <button class="copy-btn" onclick="copySnippet('${this.escapeJs(api.curl || "")}', this)">Copy</button>
                </div>
                <div class="snippet-content" id="js-${idx}">
                  <pre><code class="language-javascript">${this.escapeHtml(api.javascript || "")}</code></pre>
                  <button class="copy-btn" onclick="copySnippet('${this.escapeJs(api.javascript || "")}', this)">Copy</button>
                </div>
                <div class="snippet-content" id="response-${idx}">
                  <pre><code class="language-json">${this.escapeHtml(responseString)}</code></pre>
                  <button class="copy-btn" onclick="copySnippet('${this.escapeJs(responseString)}', this)">Copy</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join("");

    const featuresList = meta.features.map((f: any) => `<li><span class="bullet">✦</span> ${f}</li>`).join("");

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.title}</title>
  <meta name="description" content="${meta.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-color: #0b0f19;
      --card-bg: rgba(21, 28, 44, 0.65);
      --card-border: rgba(255, 255, 255, 0.08);
      --card-border-hover: rgba(99, 102, 241, 0.3);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --primary-gradient: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      --glow-color: rgba(99, 102, 241, 0.15);
      
      --color-get: #10b981;
      --color-post: #3b82f6;
      --color-put: #f59e0b;
      --color-delete: #ef4444;
      
      --font-sans: 'Outfit', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-color);
      color: var(--text-main);
      font-family: var(--font-sans);
      line-height: 1.6;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%);
      background-attachment: fixed;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 40px 20px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 50px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-glow {
      width: 14px;
      height: 14px;
      background: var(--primary-gradient);
      border-radius: 50%;
      box-shadow: 0 0 12px var(--primary);
      animation: pulse 2s infinite alternate;
    }

    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.6; }
      100% { transform: scale(1.2); opacity: 1; }
    }

    h1 {
      font-size: 1.8rem;
      font-weight: 700;
      background: var(--primary-gradient);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      letter-spacing: -0.5px;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      color: var(--color-get);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: var(--color-get);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--color-get);
    }

    .hero {
      margin-bottom: 50px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 35px;
      backdrop-filter: blur(12px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      position: relative;
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 4px;
      background: var(--primary-gradient);
      border-radius: 16px 16px 0 0;
    }

    .hero-title {
      font-size: 2.2rem;
      font-weight: 700;
      margin-bottom: 15px;
      color: #ffffff;
      letter-spacing: -0.5px;
    }

    .hero-desc {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin-bottom: 25px;
      max-width: 900px;
    }

    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
      margin-top: 20px;
    }

    .feature-grid ul {
      list-style: none;
    }

    .feature-grid li {
      color: var(--text-main);
      margin-bottom: 10px;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .bullet {
      color: var(--primary);
      font-weight: bold;
    }

    .nav-shortcuts {
      display: flex;
      gap: 15px;
      margin-top: 25px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.25s ease;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--primary-gradient);
      color: #ffffff;
      box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3);
      border: none;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-main);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-2px);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 25px;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-title::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--card-border);
    }

    .api-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      margin-bottom: 30px;
      backdrop-filter: blur(12px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .api-card:hover {
      border-color: var(--card-border-hover);
      box-shadow: 0 10px 30px var(--glow-color);
      transform: translateY(-2px);
    }

    .api-card-header {
      padding: 20px 25px;
      background: rgba(255, 255, 255, 0.02);
      border-bottom: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .api-badge-route {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .method-badge {
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 0.75rem;
      padding: 4px 10px;
      border-radius: 4px;
      letter-spacing: 0.5px;
      color: #ffffff;
    }

    .method-get { background-color: var(--color-get); }
    .method-post { background-color: var(--color-post); }
    .method-put { background-color: var(--color-put); }
    .method-delete { background-color: var(--color-delete); }

    .route-path {
      font-family: var(--font-mono);
      font-size: 1.05rem;
      color: #ffffff;
      font-weight: 500;
    }

    .api-summary {
      font-size: 1.15rem;
      font-weight: 600;
      color: var(--text-muted);
    }

    .api-card-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 900px) {
      .api-card-content {
        grid-template-columns: 1.2fr 1fr;
      }
    }

    .api-info-pane {
      padding: 25px;
    }

    .api-description {
      color: var(--text-muted);
      margin-bottom: 20px;
      font-size: 0.95rem;
    }

    .headers-info {
      background: rgba(255, 255, 255, 0.03);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      margin-bottom: 20px;
      border-left: 3px solid var(--primary);
    }

    .param-group {
      margin-top: 20px;
    }

    .param-group h5 {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 10px;
      font-weight: 600;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
      margin-bottom: 15px;
    }

    th {
      text-align: left;
      padding: 8px 12px;
      color: var(--text-muted);
      font-weight: 600;
      border-bottom: 1px solid var(--card-border);
    }

    td {
      padding: 10px 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.03);
      color: var(--text-main);
      vertical-align: middle;
    }

    code {
      font-family: var(--font-mono);
      background: rgba(255, 255, 255, 0.06);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85rem;
      color: #e5e7eb;
    }

    .badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .badge-required {
      background: rgba(239, 68, 68, 0.15);
      color: var(--color-delete);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .badge-optional {
      background: rgba(255, 255, 255, 0.08);
      color: var(--text-muted);
    }

    .api-snippet-pane {
      background: rgba(0, 0, 0, 0.25);
      border-top: 1px solid var(--card-border);
      display: flex;
      flex-direction: column;
    }

    @media (min-width: 900px) {
      .api-snippet-pane {
        border-top: none;
        border-left: 1px solid var(--card-border);
      }
    }

    .snippet-tabs {
      display: flex;
      background: rgba(0, 0, 0, 0.15);
      border-bottom: 1px solid var(--card-border);
      padding: 0 15px;
    }

    .tab-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      padding: 12px 16px;
      font-family: var(--font-sans);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s ease;
    }

    .tab-btn:hover {
      color: #ffffff;
    }

    .tab-btn.active {
      color: var(--primary);
      border-bottom-color: var(--primary);
      font-weight: 600;
    }

    .snippet-contents {
      padding: 20px;
      position: relative;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .snippet-content {
      display: none;
      flex: 1;
    }

    .snippet-content.active {
      display: block;
    }

    pre {
      background: rgba(0, 0, 0, 0.2);
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      border: 1px solid rgba(255, 255, 255, 0.03);
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #e5e7eb;
      white-space: pre-wrap;
      word-break: break-all;
      margin-bottom: 10px;
      max-height: 250px;
      overflow-y: auto;
    }

    .copy-btn {
      position: absolute;
      top: 30px;
      right: 30px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--card-border);
      color: var(--text-muted);
      padding: 5px 12px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .copy-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.2);
    }

    .ai-banner {
      margin-top: 50px;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%);
      border: 1px solid rgba(99, 102, 241, 0.25);
      border-radius: 12px;
      padding: 25px;
      display: flex;
      align-items: center;
      gap: 20px;
      backdrop-filter: blur(12px);
    }

    .ai-badge-icon {
      font-size: 2.2rem;
    }

    .ai-banner-text h4 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 4px;
    }

    .ai-banner-text p {
      color: var(--text-muted);
      font-size: 0.9rem;
    }

    footer {
      text-align: center;
      margin-top: 80px;
      padding-top: 30px;
      border-top: 1px solid var(--card-border);
      color: var(--text-muted);
      font-size: 0.85rem;
    }

    footer a {
      color: var(--primary);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="container">
    <header>
      <div class="logo-container">
        <div class="logo-glow"></div>
        <h1>${meta.title}</h1>
      </div>
      <div class="status-badge">
        <div class="status-dot"></div>
        Operational
      </div>
    </header>

    <section class="hero">
      <h2 class="hero-title">High-Performance File Management API</h2>
      <p class="hero-desc">${meta.description}</p>
      
      <div class="feature-grid">
        <ul>
          ${meta.features.slice(0, 3).map((f: any) => `<li><span class="bullet">✦</span> ${f}</li>`).join("")}
        </ul>
        <ul>
          ${meta.features.slice(3).map((f: any) => `<li><span class="bullet">✦</span> ${f}</li>`).join("")}
        </ul>
      </div>

      <div class="nav-shortcuts">
        <a class="btn btn-primary" href="${meta.swaggerDocsUrl}">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16" style="margin-right: 4px; vertical-align: middle;">
            <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 7.5a.5.5 0 0 1 0 1H5.707l2.147 2.146a.5.5 0 0 1-.708.708l-3-3a.5.5 0 0 1 0-.708l3-3a.5.5 0 1 1 .708.708L5.707 7.5H11.5z"/>
          </svg>
          Interactive Swagger Docs
        </a>
        <a class="btn btn-secondary" href="${meta.healthCheckUrl}">System Health Status</a>
        <a class="btn btn-secondary" href="/?format=json">View API JSON Spec (AI-Friendly)</a>
      </div>
    </section>

    <h2 class="section-title">API Endpoints Reference</h2>

    ${apiCards}

    <div class="ai-banner">
      <div class="ai-badge-icon">🤖</div>
      <div class="ai-banner-text">
        <h4>AI Integration Friendly</h4>
        <p>This API is fully structured and auto-documented. Other AI systems, agents, and tooling can fetch the complete API contract directly in JSON format by passing the header <code>Accept: application/json</code> or by invoking the route with query parameter <code>?format=json</code>.</p>
      </div>
    </div>

    <footer>
      <p>Developed with ❤️ by <a href="https://github.com/TuathaDeLugh" target="_blank">${meta.author}</a> | Licensed under ${meta.license}</p>
    </footer>
  </div>

  <script>
    function switchTab(button, contentId) {
      const parentPane = button.closest('.api-snippet-pane');
      
      // Deactivate all tabs in this pane
      parentPane.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Deactivate all contents in this pane
      parentPane.querySelectorAll('.snippet-content').forEach(content => {
        content.classList.remove('active');
      });
      
      // Activate clicked tab
      button.classList.add('active');
      
      // Activate matching content
      parentPane.querySelector('#' + contentId).classList.add('active');
    }

    function copySnippet(text, button) {
      navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = "Copied!";
        button.style.background = "rgba(16, 185, 129, 0.2)";
        button.style.borderColor = "var(--color-get)";
        button.style.color = "var(--color-get)";
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = "";
          button.style.borderColor = "";
          button.style.color = "";
        }, 1500);
      });
    }
  </script>
</body>
</html>`;
  }

  private escapeHtml(unsafe: string): string {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  private escapeJs(unsafe: string): string {
    return unsafe
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r");
  }
}
