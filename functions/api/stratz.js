// Cloudflare Pages Function：代理转发到 Stratz GraphQL API
// 前端请求 /api/stratz，token 从环境变量读取，不暴露给浏览器
export async function onRequestPost(context) {
  const { request, env } = context;

  const token = env.STRATZ_API_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ errors: [{ message: "服务器未配置 STRATZ_API_TOKEN 环境变量" }] }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 把前端发来的 GraphQL 请求体原样转发给 Stratz
  const body = await request.text();

  const resp = await fetch("https://api.stratz.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      // Stratz 要求带 User-Agent，否则可能被拒
      "User-Agent": "STRATZ_API"
    },
    body: body
  });

  const text = await resp.text();

  return new Response(text, {
    status: resp.status,
    headers: { "Content-Type": "application/json" }
  });
}

// 可选：拦截其他方法
export async function onRequest(context) {
  if (context.request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }
  return onRequestPost(context);
}
