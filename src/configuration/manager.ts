require('dotenv').config();

class Configuration {
  public dataBaseName?: string;
  public mongodbHostName?: string;
  public port?: string;
  public jwtSecret?: string;
  constructor() {
    this.dataBaseName = process.env.MONGODB_DATABASENAME;
    this.mongodbHostName = process.env.MONGODB_HOSTNAME;
    this.jwtSecret = process.env.jwtSecretKey;
    this.port = process.env.port;
  }
}
const configurations = new Configuration();
export { configurations };
