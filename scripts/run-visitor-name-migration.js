require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mysql = require('mysql2/promise')

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  const [cols] = await connection.query(
    `SELECT COLUMN_NAME FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'visitor_message' AND COLUMN_NAME = 'visitor_name'`,
    [process.env.DB_NAME],
  )

  if (cols.length > 0) {
    console.log('visitor_name column already exists')
  } else {
    await connection.query(
      `ALTER TABLE visitor_message
       ADD COLUMN visitor_name VARCHAR(50) DEFAULT NULL COMMENT '访客备注姓名' AFTER visitor_id`,
    )
    console.log('visitor_name column added')
  }

  await connection.end()
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
