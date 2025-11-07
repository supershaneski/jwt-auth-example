# jwt-auth-example

A demo monorepo showing JWT authentication via HttpOnly cookies using **Express (Node.js)** for the server and **Vite (React)** for the client.

## Why JWT via HttpOnly Cookie?

The token is stored automatically in a secure cookie that JavaScript cannot access.  
Safer against XSS since cookies are handled entirely by the browser.

In this example, we use **HttpOnly cookies** for web clients to demonstrate a more secure and convenient authentication pattern — no manual token storage or header management needed.

## Get Started

### 1. Clone the repo
```sh
git clone https://github.com/supershaneski/jwt-auth-example.git

cd jwt-auth-example
```

### 2. Install dependencies

```sh
npm install
```

### 3. Setup environment files

Create separate `.env` files for each app by copying `.env.example` inside each folder and filling in your values:

**apps/server/.env**

```sh
JWT_ACCESS_SECRET=your-super-secret-access-key-256-bit
JWT_REFRESH_SECRET=your-super-secret-refresh-key-256-bit
ACCESS_TOKEN_EXPIRY=120   # 2 minutes
REFRESH_TOKEN_EXPIRY=300  # 5 minutes
NODE_ENV=development
PORT=3000
```

**apps/client/.env**

```sh
VITE_API_BASE_URL=http://192.168.0.1:3000
```

> [!NOTE]  
> To find your IP address:  
> - On Linux/macOS: Run `ifconfig` or `ip addr` in the terminal.  
> - On Windows: Run `ipconfig` in Command Prompt.  
> 
> Use your **local IP**, not `localhost`, so other devices (like a phone or tablet) on the same network can access the client.
> Ensure port **5173** is allowed through your firewall.

### 4. Configure CORS

Update the CORS origins file to include your client’s actual IP address:

**apps/server/src/cors/origins.js**

```js
export default [
    'http://192.168.0.1:5173',  // replace with your local IP
]
```

> [!NOTE]  
> The client port **5173** is defined in the client’s `package.json` (`"dev": "vite --host --port 5173"`).
> If you change the client port, make sure to update it here as well.

### 5. Run both apps

From the root of the monorepo:

```sh
npm run dev
```

This will start both the **Express Node server** and the **Vite React client** simultaneously.

To stop them, press **Ctrl + C** in the terminal.


## How It Works

Once both apps are running, open the client in your browser (`http://<your_local_IP>:5173`).

### Auth Flow

1. **Login** (`POST /api/login`) →  
   The client sends credentials, and the server responds by setting **access** and **refresh tokens** in the response cookies (`Set-Cookie` headers).  
   You’ll see both cookies under the **Cookies** section of the Network tab.

2. **Accessing protected routes** (`GET /api/products`) →  
   Try requesting a protected route **before logging in** — you’ll see a **401 Unauthorized** response because there are no valid cookies.  
   After logging in, the browser automatically includes the **access token cookie** with each request (`Request Headers → Cookie`), and the server returns data normally.  
   When the **access token expires**, you’ll see the same 401 again — this time, the client will automatically call the token refresh endpoint.  
   (You can adjust the expiry time — see **[Token & Cookie Expiration](#token--cookie-expiration)** below.)

3. **Token refresh** (`POST /api/refresh`) →  
   When the access token expires, the client calls `/api/refresh`.  
   You’ll see the **refresh token** included in the request, and the response will again contain both new cookies (`Set-Cookie` headers).  
   If the **refresh token has also expired**, the server will respond with **401 Unauthorized**, requiring a new login.

4. **Logout** (`POST /api/logout`) →  
   The client calls `/api/logout`, and the server clears both cookies.  
   You’ll see `Set-Cookie` headers with `Max-Age=0`, and the cookies disappear from the browser.

By using HttpOnly cookies, the browser securely manages token storage and transmission — no manual handling needed.

> [!IMPORTANT]  
> This cookie-based method is for web clients only.
> Mobile apps cannot use HttpOnly cookies and should instead use JWT via the `Authorization` header.

### Token & Cookie Expiration

You can control how long tokens and cookies remain valid by setting these environment variables in:

**apps/server/.env**
```sh
ACCESS_TOKEN_EXPIRY=120   # 2 minutes
REFRESH_TOKEN_EXPIRY=300  # 5 minutes
```

Both the JWT tokens and cookies use the same duration for consistency.

> [!TIP]
> Typically, the **access token** should expire quickly (short-lived), while the **refresh token** lasts longer so the user stays logged in without re-authentication.


## Folder Structure

```sh
jwt-auth-example/
├── .gitignore              # Git ignore list
├── package.json            # Root config with workspace scripts
├── README.md               # Documentation
├── apps/
│   ├── server/             # Express (Node.js) backend
│   │   ├── package.json
│   │   └── src/            # API routes, JWT logic, CORS setup, etc.
│   └── client/             # Vite (React) frontend
│       ├── package.json
│       └── src/            # Components, pages, and API calls
└── node_modules/           # Installed dependencies
```


