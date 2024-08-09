const setData = require("../data/setData");
const themeData = require("../data/themeData");

require('dotenv').config();
const Sequelize = require("sequelize");
dialectModule: require("pg");

// set up sequelize to point to our postgres database
const sequelize = new Sequelize(
  process.env.database,
  process.env.user,
  process.env.password,
  {
    host: process.env.host,
    dialect: "postgres",
    port: 5432,
    dialectModule: require("pg"),
    
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

// Declaring model for the sequel database
// Model-1
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
  }
});

// Model-2
const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true,
  },
  name: {
    type: Sequelize.STRING,
  },
  year: {
    type: Sequelize.INTEGER,
  },
  num_parts: {
    type: Sequelize.INTEGER,
  },
  theme_id: {
    type: Sequelize.INTEGER,
  },
  img_url: {
    type: Sequelize.STRING
  },
});

// Set the association between theme and Set
Set.belongsTo(Theme, { foreignKey: 'theme_id' });

function initialize() {
  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.sync();
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

// Updated version
async function getAllSets() {
  try {
    const sets = await Set.findAll({ include: [Theme] });
    return sets;
  } catch (error) {
    console.error("Error getting all sets:", error);
    throw error;
  }
}

// Updated version
async function getSetByNum(setNum) {
  try {
    const set = await Set.findOne({
      where: { set_num: setNum },
      include: [Theme],
    });
    if (set) {
      return set;
    } else {
      throw `Set not found with set_num: ${setNum}`;
    }
  } catch (error) {
    console.error("Error getting set by set_num:", error);
    throw error;
  }
}

// Updated version
async function getSetsByTheme(theme) {
  try {
    const sets = await Set.findAll({
      include: [Theme],
      where: {
        "$Theme.name$": {
          [Sequelize.Op.iLike]: `%${theme}%`,
        },
      },
    });
    if (sets.length > 0) {
      return sets;
    } else {
      throw `No sets found for theme: ${theme}`;
    }
  } catch (error) {
    console.error("Error getting sets by theme:", error);
    throw error;
  }
}

async function addSet(setData) {
  try {
    console.log(setData);
    await Set.create(setData);
  } catch (err) {
    // throw new error
    throw err.errors[0].message;
  }
};

const getAllThemes = async () => {
  try {
    const themes = await Theme.findAll();
    return themes;
  } catch (err) {
    throw err;
  }
};

const editSet = async (setNum, setData) => {
  try {
    await Set.update(setData, { where: { set_num: setNum } });
  } catch (err) {
    throw err.errors[0].message;
  }
};

const deleteSet = async (set_num) => {
  try {
    await Set.destroy({ where: { set_num: set_num } });
  } catch (err) {
    throw err.errors[0].message;
  }
};

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet };

// Commenting out the code snippet since our data is not available in the 
//database and there is no need to run it again and again

// // Code Snippet to insert existing data from Set / Themes

// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await Theme.bulkCreate(themeData);
//       await Set.bulkCreate(setData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Sets" violates foreign key constraint "Sets_theme_id_fkey"

//       // it is because you have a "set" in your collection that has a "theme_id" that does not exist in the "themeData".   

//       // To fix this, use PgAdmin to delete the newly created "Themes" and "Sets" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });
