import { join } from 'path'

export default {
  enabled: true,
  dotFiles: 'ignore',
  etag: true,
  lastModified: true,
  maxAge: 0,
  serveFiles: true,
  root: join(__dirname, '..', 'public'), // Define a raiz como pasta "public"
}
