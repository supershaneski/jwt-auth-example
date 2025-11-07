import dotenv from 'dotenv'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { OpenAPIBackend } from 'openapi-backend'

import errorLoggerMiddleware from './middleware/errorLogger.js'
import loggerMiddleware from './middleware/logger.js'
import jwtAuth from './middleware/jwtAuth.js'
import refreshAuth from './middleware/refreshAuth.js'

import origins from './cors/origins.js'

import { loginHandler, logoutHandler, refreshHandler } from './stubs/authorization.js'
import { productsHandler } from './stubs/products.js'

dotenv.config()

const app = express()

// Security middleware
app.use(cookieParser())
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return callback(null, true)
    if (origins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// Logger middleware
app.use(loggerMiddleware)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// OpenAPI Backend
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const openApiPath = resolve(__dirname, '../openapi.yaml')
console.log('Loading OpenAPI from:', openApiPath)

const api = new OpenAPIBackend({
  definition: openApiPath,
})

api.register({
  validationFail: async (c, req, res) => {
    return res.status(400).json({
      status: 'error',
      created: Date.now(),
      error: 'INVALID_REQUEST',
      message: c.validation.errors?.map((err) => err.message).join(', ') || 'Validation failed',
    })
  },
  notFound: async (c, req, res) => {
    return res.status(404).json({
      status: 'error',
      created: Date.now(),
      error: 'NOT_FOUND',
      message: 'Resource not found',
    })
  },
  notImplemented: async (c, req, res) => {
    // Use schema example for unimplemented endpoints
    const { status, mock } = c.api.mockResponseForOperation(c.operation.operationId);
    return res.status(status).json({
      ...mock,
      created: Date.now(), // Ensure created timestamp is included
    })
  },
  /*
  // Use this instead if you want to show error for unimplemented endpoints
  notImplemented: (c, req, res) => {
    console.error(`MISSING HANDLER: ${c.operation.operationId}`);  // LOG IT
    return res.status(501).json({
      status: 'error',
      created: Date.now(),
      error: 'NOT_IMPLEMENTED',
      message: `Handler for ${c.operation.operationId} is not registered!`,
    });
  },
  */
})

// Register security handlers
api.registerSecurityHandler('CookieAuth', jwtAuth)
api.registerSecurityHandler('RefreshCookieAuth', refreshAuth)

api.register('unauthorizedHandler', async (c, req, res) => {
  return res.status(401).json({
    status: 'error',
    created: Date.now(),
    error: 'UNAUTHORIZED',
    message: 'Invalid access',
  })
})

api.register({
  Login: loginHandler,
  Logout: logoutHandler,
  Refresh: refreshHandler,
  GetProducts: productsHandler,
})

// Initialize OpenAPI Backend
api.init()

// Use OpenAPI Backend as middleware
app.use((req, res) => api.handleRequest(req, req, res))

// Error logger middleware should come after routes
app.use(errorLoggerMiddleware)

// Error handling
app.use((err, req, res, next) => {
  console.error('ERROR-HANDLER', err)

  const status = err.statusCode || 500;
  const message = err.message || 'Internal server error'
  const code = err.code || 'INTERNAL_SERVER_ERROR'

  res.status(status).json({
    status: 'error',
    created: Date.now(),
    error: code,
    message,
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.info(new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' }), `Demo API Server running at http://localhost:${PORT}`)
})
