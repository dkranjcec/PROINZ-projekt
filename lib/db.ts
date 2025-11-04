import postgres from 'postgres'

// Create a postgres connection
// Docs: https://github.com/porsager/postgres
const sql = postgres(process.env.DATABASE_URL!, {
  max: 10, // Maximum number of connections in pool
  idle_timeout: 20,
  connect_timeout: 10,
})

export default sql
