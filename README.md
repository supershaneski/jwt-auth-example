# JWT Auth Example (HttpOnly Cookies)

[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-purple)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **beginner-friendly monorepo** demonstrating secure JWT authentication using **HttpOnly cookies** with:
- **Express.js** (Node.js) backend
- **Vite + React** frontend

## Why HttpOnly Cookies?

The token is stored automatically in a secure cookie that JavaScript cannot access - no manual token storage or header management needed. Safer against XSS since cookies are handled entirely by the browser.

> [!TIP]
> For mobile apps, use `Authorization` headers.

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
REFRESH_TOKEN_EXPIRY=604800  # seconds (7 days recommended in prod)
NODE_ENV=development
PORT=3000
```

#### `apps/client/.env`
```sh
VITE_API_BASE_URL=http://192.168.1.100:3000  # Use your local IP
```

Use **your local IP**, not `localhost`, to allow phone/tablet testing.


### 3. Update CORS Origins

```js
// apps/server/src/cors/origins.js
export default [
  'http://192.168.1.100:5173',  // Replace with your IP
]
```

### 4. Run Both Apps

```bash
npm run dev
```

Opens:
- Client: `http://your-ip:5173`
- Server: `http://your-ip:3000`


## How It Works

### Auth Flow Overview

```mermaid
graph TD
    A[Login] --> B[Server sets HttpOnly cookies]
    B --> C[Browser auto-sends accessToken]
    C --> D[Access protected routes]
    D --> E{Access token expired?}
    E -->|Yes| F[Auto refresh using refreshToken]
    E -->|No| G[Success]
    F --> H[New tokens set via Set-Cookie]
```


### Key Features

1. **Login** → `POST /api/login` → sets `accessToken` + `refreshToken` cookies
2. **Protected routes** → auto-include `accessToken`
3. **Auto refresh** → when 401, client calls `/api/refresh`
4. **Logout** → clears both cookies

### Try It

1. Open [http://your-ip:5173](http://your-ip:5173)
2. Login with:
   ```json
   { "username": "alice", "password": "password" }
   ```
3. Click "Get Products" → works!
4. Wait 2 minutes → access token expires → auto-refreshed!

> [!Note]
> Please note that there is also a simulated delay in `/api/products` to test **retry** and **timeout** behavior on the client. To disable it, comment out this line:
> 
> **apps/server/src/stubs/products.js**
> ```js
> await sleep(delay)
> ```

## Security Details

### JWT Creation

For this example, we are using [jose](https://github.com/panva/jose) for JWT creation and verification in the backend.

```js
import { SignJWT } from 'jose'

const JWT_SECRET = 'your-super-secret-key-256-bit'
const secret = new TextEncoder().encode(JWT_SECRET)

const token_expiry = 5 * 60 * 1000 // 5 mins
const now = Math.floor(Date.now() / 1000)

const payload = {
   sub: 'abc123',
   username: 'John Doe',
   role: 'user',
   iat: now,
}

const token = await new SignJWT(payload)
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(now + token_expiry)
  .sign(secret)
```

Generate strong keys:
```bash
openssl rand -base64 32
```

Sample JWT output:
```sh
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVzZXJuYW1lIjoiYWxpY2UiLCJyb2xlIjoidXNlciIsImlhdCI6MTc2MjczNjg2NCwiZXhwIjoxNzYyNzM2OTg0fQ.62qK2Hyl36hO9HV_oW0Ix76N54Ivdn3a_6KDcM1Z5cE
```

You can check view the payload in this token by using the [JSON Web Token Debugger](https://www.jwt.io/).


### JWT Verification

To verify the token received from the request

```js
import { jwtVerify } from 'jose'

try {

   const JWT_SECRET = 'your-super-secret-key-256-bit'
   const secret = new TextEncoder().encode(JWT_SECRET)

   const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
   })

   console.log(payload)

   /*
      {
         "sub": "u1",
         "username": "alice",
         "role": "user",
         "iat": 1762736864,
         "exp": 1762736984
      }
   */

  req.user = payload

} catch(err) {
   console.log(err.message)
}
```

In this example, we are not consuming the payload but our middleware that handles JWT passes this info via the request parameter and you can read it directly from the route handler.

```js
export const routeHandler = async (c, req, res) => {
   console.log(req.user)
}
```


### Cookie Settings

We create HttpOnly cookies for each of our JWT tokens

```js
res.cookie('accessToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge: ACCESS_TOKEN_EXPIRY * 1000  // seconds → ms
})

res.cookie('refreshToken', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/refresh',
  maxAge: REFRESH_TOKEN_EXPIRY * 1000
})
```

### Required CORS Headers

```js
app.use(cors({
  origin: origins,
  credentials: true  // REQUIRED for cookies
}))
```

And response headers:
```sh
Access-Control-Allow-Credentials: true
```

Make sure each request includes `credentials: 'include'` in the fetch options so the browser sends and stores cookies properly.

```js
const response = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username, password })
})
```

### Login

When you send login request, open the browser **DevTools** and go to the **Network** tab and select **Cookies**. You will see in the **Response Cookies** section the access and refresh tokens.

**Response Cookies**
| Name         | Value                   | Path          | Expires       | Max-Age    | HttpOnly | SameSite |
|---------------|--------------------------|---------------|---------------|---------------|---------------|---------------|
| accessToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  | /             | 11/10/2025, 10:09:44 AM | 120      | ✓ | Strict |
| refreshToken  | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...      | /api/refresh  | 11/10/2025, 10:12:44 AM | 120      | ✓ | Strict |


### Protected Route

When you access any protected routes, the browser will append the **accessToken** cookie.

**Request Cookies**
| Name         | Value                   |
|---------------|--------------------------|
| accessToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |

### Refresh

When you refresh the token, the **refreshToken** cookie will be appended instead and you will receive new JWT token cookies in the response

**Request Cookies**
| Name         | Value                   |
|---------------|--------------------------|
| refreshToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |

**Response Cookies**
| Name         | Value                   |
|---------------|--------------------------|
| accessToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |
| refreshToken   | eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1MSIsInVz...  |

### Logout

When you logout, the logout handler in the server removes the cookies

```js
export const logoutHandler = async (c, req, res) => {
  
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

  return res.status(200).json({
    status: 'success',
    created: Date.now(),
  })

}
```

You can verify this by checking the response cookies.

**Response Cookies**
| Name         | Value                   | Path          | Expires       | Max-Age    | HttpOnly | SameSite |
|---------------|--------------------------|---------------|---------------|---------------|---------------|---------------|
| accessToken   |   | /             | 1/1/1970, 9:00:00 AM | --      | ✓ | Strict |
| refreshToken  |       | /api/refresh  | 1/1/1970, 9:00:00 AM | --      | ✓ | Strict |


## Folder Structure

```
jwt-auth-example/
├── apps/
│   ├── server/              # Express backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── middleware/jwt.js
│   │   │   └── cors/origins.js
│   │   └── .env
│   └── client/              # Vite + React
│       ├── src/
│       │   ├── api/
│       │   └── components/
│       └── .env
├── package.json
└── README.md
```
