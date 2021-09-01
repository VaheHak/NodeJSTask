const Users = require("../models/user");

async function main() {
  const models = [
    Users,
  ]

  for ( const i in models ){
    if (models.hasOwnProperty(i)){
      console.log('--->', i)
      await models[i].sync({alter: true});
    }
  }
  process.exit();
}

main().then(r => console.log(r-- > 'Done')).catch(e => console.log(e));
