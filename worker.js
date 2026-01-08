export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. 处理 POST 请求：添加/修改重定向规则
    if (request.method === "POST" && url.pathname === "/set-redirect") {
      try {
        const body = await request.json();
        const { source, target } = body;
        if (!source || !target) {
          return new Response("缺少 source 或 target 参数", { status: 400 });
        }
        await env.REDIRECT_KV.put(source, target);
        return new Response(`已设置重定向：${source} → ${target}`, { status: 200 });
      } catch (e) {
        return new Response(`请求体格式错误：${e.message}`, { status: 400 });
      }
    }

    // 2. 处理普通请求：执行重定向（优化匹配逻辑）
    // 关键修改：统一格式化 URL（去除末尾的 /，统一协议和域名）
    let fullRequestUrl = url.origin + url.pathname;
    // 去除 URL 末尾的 /（比如 https://dav1970.qzz.io/ → https://dav1970.qzz.io）
    fullRequestUrl = fullRequestUrl.replace(/\/$/, "");
    
    // 调试日志（Cloudflare Worker 控制台可查看）
    console.log("当前访问的格式化URL：", fullRequestUrl);
    
    // 从 KV 读取规则（先读格式化后的 URL，兼容末尾 / 的情况）
    let targetUrl = await env.REDIRECT_KV.get(fullRequestUrl);
    // 如果没找到，再尝试给 URL 加 / 匹配（双向兼容）
    if (!targetUrl) {
      const urlWithSlash = fullRequestUrl + "/";
      console.log("尝试匹配带/的URL：", urlWithSlash);
      targetUrl = await env.REDIRECT_KV.get(urlWithSlash);
    }

    // 3. 匹配到规则则重定向
    if (targetUrl) {
      console.log("匹配到重定向规则：", fullRequestUrl, "→", targetUrl);
      return Response.redirect(targetUrl, 301);
    }

    // 4. 未匹配到的响应（显示实际匹配的 URL，方便排查）
    return new Response(`未找到 ${fullRequestUrl} 的重定向规则
    （KV 中已存的 Key：可在 Worker 控制台查看日志）`, { 
      status: 404,
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    });
  }
};
