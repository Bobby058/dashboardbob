import express from 'express'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import routes from './routes/authroute.js'

const app = express()
const PORT = process.env.PORT || 5001

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

app.use(express.json())
app.use(express.static(path.join(__dirname, '../public')))
app.use('/api', routes)

app.listen(PORT, () => {
    console.log(`server has run in port: ${PORT}`)
})