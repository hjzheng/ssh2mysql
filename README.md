# ssh2mysql

```
npm install @jxz/ssh2mysql
```

```
// config.json
// you can get db configuration description from mysql2 and ssh configuration description from tunnel-ssh

"db": {
    "type": "mysql",
    "host": "10.0.1.57",
    "port": 3306,
    "username": "xxxx",
    "password": "passwd",
    "database": "db"
  },
  "ssh": {
    "username": "root",
    "host": "10.0.1.60",
    "port": 22,
    "dstHost": "10.0.1.57",
    "dstPort": 3306,
    "localHost": "127.0.0.1",
    "localPort": 12345,
    "privateKey": "/Users/hjzheng/.ssh/id_rsa"
  }

// execSql.ts

import * as ssh2mysql from '@jxz/ssh2mysql'
import { config } from '@ys/api'

const fs = require('fs')
const dbConf = config.db
const sshConf = config.ssh

let mysql

const execSql = async (sql: string) => {
  if (!mysql) {
    mysql = await ssh2mysql.connect(
      {
        ...sshConf,
        privateKey: fs.readFileSync(sshConf.privateKey),
      },
      { ...dbConf, user: dbConf.username },
    )
  }
  return mysql.execSql(sql)
}

export default execSql
```