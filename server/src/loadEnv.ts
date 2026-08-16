import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const srcDir = path.dirname(fileURLToPath(import.meta.url))
const serverDir = path.resolve(srcDir, '..')
const rootDir = path.resolve(serverDir, '..')

dotenv.config({ path: path.join(rootDir, '.env') })
dotenv.config({ path: path.join(serverDir, '.env'), override: true })

export function loadEnv() {
  dotenv.config({ path: path.join(rootDir, '.env') })
  dotenv.config({ path: path.join(serverDir, '.env'), override: true })
}