
---

### 2. 核心文件：`worker.js`（Worker 代码）
```javascript
/**
 * Cloudflare Worker 网址重定向工具
 * 功能：动态配置多组网址重定向，规则存储在 Cloudflare KV 中
 * 作者：自定义（可填写你的名字/昵称）
 * 版本：1.0.0
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 处理 POST 请求：添加/修改重定向规则
    if (request.method === "POST" && url.pathname === "/set-redirect") {
      try {
        const body = await request.json();
        const { source, target } = body;

        // 校验参数
        if (!source || !target) {
          return new Response("❌ 缺少 source 或 target 参数", { 
            status: 400,
            headers: { "Content-Type": "text/plain;charset=utf-8" }
          });
        }

        // 统一格式化源 URL（去除末尾/）
        const formattedSource = source.replace(/\/$/, "");
        // 存储规则到 KV
        await env.REDIRECT_KV.put(formattedSource, target);
        
        return new Response(`✅ 已设置重定向：${formattedSource} → ${target}`, { 
          status: 200,
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
      } catch (e) {
        return new Response(`❌ 请求体格式错误：${e.message}
        正确格式示例：{"source": "https://a.com", "target": "https://a1.com"}`, { 
          status: 400,
          headers: { "Content-Type": "text/plain;charset=utf-8" }
        });
      }
    }

    // 处理普通请求：执行重定向
    let fullRequestUrl = url.origin + url.pathname;
    // 统一格式化访问 URL（去除末尾/）
    fullRequestUrl = fullRequestUrl.replace(/\/$/, "");
    
    // 调试日志（Worker 控制台可查看）
    console.log("🔍 当前访问的格式化URL：", fullRequestUrl);
    
    // 从 KV 读取重定向规则
    let targetUrl = await env.REDIRECT_KV.get(fullRequestUrl);

    // 匹配到规则则重定向（301 永久重定向，如需临时重定向改为 302）
    if (targetUrl) {
      console.log("✅ 匹配到规则：", fullRequestUrl, "→", targetUrl);
      return Response.redirect(targetUrl, 301);
    }

    // 未匹配到规则的响应
    return new Response(`❌ 未找到 ${fullRequestUrl} 的重定向规则
    📌 已存规则可在 Cloudflare KV（REDIRECT_KV）中查看
    📌 调试日志：可在 Worker 控制台「日志」标签查看`, { 
      status: 404,
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
  }
};
