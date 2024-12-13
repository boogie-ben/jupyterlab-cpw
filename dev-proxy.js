import http from 'node:http'
import httpProxy from 'http-proxy'

/** 开发环境没有代理服务器去线上接口，手动弄一个 */

const PROXY_URL = 'https://lab.devops.tencent-cep.com'
const proxy = httpProxy.createProxyServer({})

const server = http.createServer((req, res) => {
  // 支持开发环境fetch跨域
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888') // jupyterlab的默认端口
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Cookie, X-Csrftoken, Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // 对于OPTIONS请求（浏览器预检查跨域请求时会发送该请求），直接返回200响应，避免浏览器拦截后续真正的请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  proxy.web(
    req,
    res,
    {
      target: PROXY_URL,
      changeOrigin: true,
      headers: { Referer: PROXY_URL, Origin: PROXY_URL, Host: PROXY_URL.replace('https://') },
    },
  )
})

const port = 8889
server.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`)
})
