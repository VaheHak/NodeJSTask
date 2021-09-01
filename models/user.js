const {Model, DataTypes} = require('sequelize');
const md5 = require('md5');
const db = require("../services/pool");

class Users extends Model {

  static passwordHash = (pass) => {
    return md5(md5(pass + '_test'))
  }

}

Users.init({
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: 'email',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    set(val) {
      this.setDataValue('password', Users.passwordHash(val))
    },
    get() {
      return undefined;
    }
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true,
    get() {
      const avatar = this.getDataValue('avatar');
      if (avatar !== undefined){
        return avatar;
      }
      return undefined;
    }
  },
}, {
  sequelize: db,
  tableName: 'users',
  modelName: 'users',
});

module.exports = Users;
