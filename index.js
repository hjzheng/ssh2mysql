const mysql = require('mysql2');
const tunnel = require('tunnel-ssh');

const ssh2mysql = {
  _conn: null,

  _mysql_pool: null,

  /**
   * @param obj sshConfig SSH Configuration as defined by ssh2 package
   * @param obj dbConfig MySQL Configuration as defined by mysql(2) package
   * @return Promise
   */
  connect: function(sshConfig, dbConfig) {
    dbConfig = ssh2mysql._addDefaultsDBConfig(dbConfig);
    sshConfig = ssh2mysql._addDefaultsSSHConfig(sshConfig);
    return new Promise(function(resolve, reject) {
      ssh2mysql._conn = new tunnel(sshConfig, (error, tnl) => {
        if (error) {
          ssh2mysql.close();
          var msg =
            error.reason == 'CONNECT_FAILED' ? 'Connection failed.' : error;
          return reject(msg);
        }

        ssh2mysql._mysql_pool = mysql.createPool(dbConfig);

        const execSql = sql => {
          return new Promise((resolve, reject) => {
            ssh2mysql._mysql_pool.getConnection(function(err, conn) {
              if (err) {
                reject(err);
                ssh2mysql._mysql_pool.releaseConnection(conn);
              }
              conn.query(sql, (error, results) => {
                if (error) {
                  reject(error);
                } else {
                  resolve(results);
                }
                ssh2mysql._mysql_pool.releaseConnection(conn);
              });
            });
          });
        };
        resolve({ execSql });
      });
    });
  },

  close: function() {
    if ('end' in ssh2mysql._mysql_pool) {
      ssh2mysql._mysql_pool.end(() => {});
    }
    if ('end' in ssh2mysql._conn) {
      ssh2mysql._conn.end();
    }
  },

  _addDefaultsSSHConfig(sshConfig) {
    return Object.assign(
      { keepAlive: true, localHost: '127.0.0.1', localPort: 12345, port: 22 },
      sshConfig
    );
  },

  _addDefaultsDBConfig(dbConfig) {
    return Object.assign({ host: 'localhost', port: 3306 }, dbConfig);
  }
};

module.exports = ssh2mysql;
