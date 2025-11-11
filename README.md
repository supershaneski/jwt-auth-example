# JWT Auth Example (HttpOnly Cookies)

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **beginner-friendly monorepo** demonstrating secure JWT authentication using **HttpOnly cookies** with:
- **Express.js** (Node.js) backend
- **Vite + React** frontend

---

**初心者向けモノレポ** で、**HttpOnly Cookie** を使った安全な JWT 認証を示します：
- **Express.js** (Node.js) バックエンド
- **Vite + React** フロントエンド

## Why HttpOnly Cookies? ／　なぜ HttpOnly Cookie なのか？
With **HttpOnly cookies**, the token is stored securely by the browser and cannot be accessed via JavaScript. This means you don’t need to manually store the token or manage headers, and it provides better protection against XSS attacks.

---

**HttpOnly Cookie** を使うと、トークンはブラウザによって安全に保存され、JavaScript からアクセスできません。  
これにより、トークンを手動で保存したりヘッダーを管理したりする必要がなくなり、XSS 攻撃からの保護も向上します。


> [!TIP]
> **HttpOnly cookies** only work in web browsers. For mobile apps or non-browser clients, store tokens in memory or secure storage and send them via `Authorization` headers.
> 
> **HttpOnly Cookie** はウェブブラウザでのみ動作します。モバイルアプリやブラウザ以外のクライアントでは、トークンをメモリや安全なストレージに保存し、`Authorization` ヘッダーで送信してください。


## Get Started

### 1. Clone and install
```sh
git clone https://github.com/supershaneski/jwt-auth-example.git
cd jwt-auth-example
npm install
```

### 2. Setup Environment Files
Copy the example files:

```sh
# Server
cp apps/server/.env.example apps/server/.env

# Client
cp apps/client/.env.example apps/client/.env
```

#### `apps/server/.env`
```sh
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-256-bits-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-256-bits-here
ACCESS_TOKEN_EXPIRY=120      # seconds (2 minutes)
REFRESH_TOKEN_EXPIRY=300  # seconds (5 minutes for testing)
NODE_ENV=development
PORT=3000
```

#### `apps/client/.env`
```sh
VITE_API_BASE_URL=http://192.168.1.100:3000  # Use your local IP address
```

Use **your local IP address**, not `localhost`, to allow phone/tablet testing.


### 3. Update CORS Origins

**apps/server/src/cors/origins.js**
```js
export default [
  'http://192.168.1.100:5173',  // Replace with your IP address
]
```

### 4. Run Both Apps

```bash
npm run dev
```

Runs:
- Client: `http://your-ip:5173`
- Server: `http://your-ip:3000`


### 5. Try It

1. Open the client in your browser: [http://your-ip:5173](http://your-ip:5173)
2. Press the **Login** button.
3. Press **Get Products**. (This should succeed. See **Console** section in the **DevTools**)
4. Wait **2 minutes** (to allow the token to expire) → Press **Get Products** again → triggers **token auto-refresh**

> [!Note]
> There is a simulated network delay in the backend route `/api/products` to help test **retry** and **timeout** behavior on the client side. To disable this delay, please comment out the following line in the server file:
> 
> **apps/server/src/stubs/products.js**
> ```js
> await sleep(delay)
> ```

## How It Works
From the client, open the browser **DevTools** and check the **Network** tab.

### Auth Flow Overview

**1. Login** `POST /api/login` →  
If the client sends valid credentials, the server generates **access** and **refresh** tokens and sets the corresponding cookies for the response.

```js
import { SignJWT } from 'jose'

const ACCESS_TOKEN_EXPIRY = Number(process.env.ACCESS_TOKEN_EXPIRY || 120)
const REFRESH_TOKEN_EXPIRY = Number(process.env.REFRESH_TOKEN_EXPIRY || 300)

const now = Math.floor(Date.now() / 1000)

const payload = {
  sub: user.id,
  username: user.username,
  role: user.role,
  iat: now,
}

const accessToken = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(now + ACCESS_TOKEN_EXPIRY)
  .sign(accessSecret)

const refreshToken = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(now + REFRESH_TOKEN_EXPIRY)
  .sign(refreshSecret)

res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: ACCESS_TOKEN_EXPIRY * 1000,
})

res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/refresh',
  maxAge: REFRESH_TOKEN_EXPIRY * 1000,
})
```

You’ll see the cookies under the **Cookies** section of the **Network** tab in the client.

**Response Cookies**
| Name         | Value                   | Path          | Expires       | Max-Age    | HttpOnly | SameSite |
|---------------|--------------------------|---------------|---------------|---------------|---------------|---------------|
| accessToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  | /             | 11/10/2025, 10:09:44 AM | 120      | ✓ | Strict |
| refreshToken  | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...      | /api/refresh  | 11/10/2025, 10:12:44 AM | 120      | ✓ | Strict |

Check the **Path** column. **accessToken** cookie will be automatically attached to all requests except `/api/refresh` while **refreshToken** cookie will be attached only when requesting `/api/refresh`.

**2. Protected route** `GET /api/products` →  
When the user requests a protected route, you can see from the **Cookies** section of the **Network** tab that the **accessToken** cookie is attached to the request.

**Request Cookies**
| Name         | Value                   |
|---------------|--------------------------|
| accessToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |

If the **accessToken** cookie is still valid, we can decode the JWT and extract the payload from the route handler.

```js
import { jwtVerify } from 'jose'

const token = req.cookies?.accessToken

const { payload } = await jwtVerify(token, secret, {
  algorithms: ['HS256'],
})

console.log(payload)
```

If you request a protected route before logging **in**, or after the **accessToken** cookie has expired, **no cookies will be attached**, and you will get a **401 Unauthorized** response. This is where we will handle **token refresh**.

> [!NOTE]
> A **protected route** is a route or endpoint that is under some security scheme and requires **authentication**.

**3. Token refresh** `POST /api/refresh` →  
When the user request the refresh route, the browser automatically attaches the **refreshToken** cookie.

**Request Cookies**
| Name         | Value                   |
|---------------|--------------------------|
| refreshToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |

However, we also set expiration in our **refreshToken** cookie so if we request the refresh route after it expires, no cookies will be attached to the request. In that case, we will receive **401 Unauthorized** again.

If the **refreshToken** cookie is still valid, we will receive new **accessToken** and **refreshToken** cookies.

**4. Logout** `POST /api/logout` →  
In this example, logout is not a **protected route**. As such, there will be no cookies sent with the request. Even so, the logout handler in the backend will reset the cookies in the response.

```js
res.clearCookie('accessToken', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
})

res.clearCookie('refreshToken', {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/refresh',
})
```

You can verify this at the **Response Cookies** in the client.

**Response Cookies**
| Name         | Value                   | Path          | Expires       | Max-Age    | HttpOnly | SameSite |
|---------------|--------------------------|---------------|---------------|---------------|---------------|---------------|
| accessToken   |   | /             | 1/1/1970, 9:00:00 AM | --      | ✓ | Strict |
| refreshToken  |       | /api/refresh  | 1/1/1970, 9:00:00 AM | --      | ✓ | Strict |


## CSRF Token
Using **HttpOnly cookies** for JWT (or session) storage protects against **XSS token theft**, but leaves you vulnerable to **Cross-Site Request Forgery (CSRF)** attacks. In a CSRF attack, a malicious site tricks an authenticated user's browser into making an unwanted request to your app — and the browser automatically attaches **HttpOnly cookies**.

To mitigate this, we use the **double-submit cookie pattern** with a **non-HttpOnly CSRF token**.

When the user logs, we generate the **CSRF token** and set it to a (readable) cookie.

```js
import { randomUUID } from 'crypto'

const csrfToken = randomUUID()

res.cookie('csrfToken', csrfToken, {
  httpOnly: false,  // Must be false so JS can read it
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: REFRESH_COOKIE_EXPIRY,
})
```

You can check it from the **Cookies** section in the **Network** tab.

**Response Cookies**
| Name         | Value                   | Path          | Expires       | Max-Age    | HttpOnly | SameSite |
|---------------|--------------------------|---------------|---------------|---------------|---------------|---------------|
| csrfToken   | d648682c-9e2b-44ed-8b6c-9fa65...  | /             | 11/10/2025, 10:09:44 AM | 300      | ✓ | Lax |

The client then reads the token from the cookie and stores it:

```js
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrfToken='))
  ?.split('=')[1]
```

We will then attach it as a **custom header** (e.g., `X-XSRF-TOKEN`) for **every state-changing request**.
In our example, we will use it when requesting the refresh endpoint.

```sh
POST /api/refresh HTTP/1.1
Accept: application/json
Accept-Encoding: gzip, deflate
Accept-Language: en-US,en;q=0.9
Connection: keep-alive
Content-Length: 0
Content-Type: application/json
Cookie: refreshToken=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVzZXJuYW1lIjoiYWxpY2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MjgxOTA5MCwiZXhwIjoxNzYyODE5MzkwfQ.2Gs_dQ_SzxJN0bW4cBOYhiZQq88w0AnY-NJD7bDGchU; csrfToken=5aee6a31-0100-4391-9f29-8631796e1075
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Safari/605.1.15
x-csrf-token: 5aee6a31-0100-4391-9f29-8631796e1075
```

As you can see, we are sending the **csrfToken** both in the request cookie and in the **x-csrf-token** header.

The backend then validates by comparing cookie vs header:

```js
const csrfCookie = req.cookies?.csrfToken
const csrfHeader = req.get('x-csrf-token')

if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
  c.securityError = 'CSRF_MISMATCH'
  return false
}
```

Since a malicious site cannot read the cookies set for your domain, and cannot arbitrarily send custom headers with an authentic request due to browser security policies (like the **Same-Origin Policy** and **CORS** restrictions), the attacker cannot retrieve and attach the correct **CSRF token**. As a result, the attack fails.


---