require('dotenv').config();

class Configuration {
  public dataBaseName?: string;
  public mongodbHostName?: string;
  public port?: string;
  public jwtSecret?: string;
  constructor() {
    this.dataBaseName = process.env.MONGODB_DATABASE;
    this.mongodbHostName = process.env.MONGODB_HOSTNAME;
    this.jwtSecret = process.env.JWT_SECRET_KEY;
    this.port = process.env.PORT;
  }
}
const configurations = new Configuration();
export { configurations };
