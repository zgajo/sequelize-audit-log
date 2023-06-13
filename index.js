const { Sequelize, DataTypes } = require("sequelize");

// Option 1: Passing a connection URI
const sequelize = new Sequelize(
  "postgres://postgres:postgrespassword@localhost:5432/test?schema=public"
); // Example for postgres

var UserHistory = sequelize.define("user_history", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    unique: true,
  },
  // same attributes as Product
  userId: {
    type: Sequelize.INTEGER,
    unique: false,
    references: {
      key: "id",
      model: "users",
    },
  },
  name: DataTypes.TEXT,
  favoriteColor: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  age: { type: DataTypes.INTEGER, allowNull: true },
  cash: { type: DataTypes.INTEGER, allowNull: true },
  change_date: {
    type: Sequelize.DATE,
    allowNull: true,
  },
  change_type: {
    type: Sequelize.ENUM("create", "update", "delete"),
  },
  editorId: {
    type: Sequelize.INTEGER,
  },
});

const User = sequelize.define(
  "user",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.TEXT,
    favoriteColor: {
      type: DataTypes.TEXT,
      defaultValue: "green",
    },
    age: DataTypes.INTEGER,
    cash: DataTypes.INTEGER,
  },
  {
    hooks: {
      afterUpdate: async function (user, options) {
        console.log("User updated", user, options);
        // Insert the old version of the user into the history table
        const history = {
          userId: user._previousDataValues.id,
          change_date: new Date(),
          change_type: "update",
          editorId: options.user.id, // get the editorId from options.user
        };
        for (const field of options.fields) {
          if (
            field === "updatedAt" ||
            field === "createdAt" ||
            field === "id"
          ) {
            continue;
          }

          history[field] = user.dataValues[field];
        }

        await UserHistory.create(history);
      },
      afterSave: function (user, options) {
        console.log("User saved", user, options);
      },
      afterCreate: async function (user, options) {
        console.log("User created", user, options);
        // Insert the old version of the user into the history table
        const history = {
          userId: user.dataValues.id,
          change_date: new Date(),
          change_type: "create",
          editorId: options.user.id, // get the editorId from options.user
        };

        for (const field of options.fields) {
          if (
            field === "updatedAt" ||
            field === "createdAt" ||
            field === "id"
          ) {
            continue;
          }

          history[field] = user.dataValues[field];
        }

        await UserHistory.create(history);
      },
    },
  }
);

(async () => {
  try {
    await sequelize.sync({ force: true });
    await sequelize.authenticate();
    const jane = await User.create(
      { name: "Jane", age: 25, cash: 100 },
      {
        // user fetched from headers
        user: {
          id: 2,
        },
      }
    );
    jane.name = "Ada";
    jane.age = 20;

    await jane.save({
      // user fetched from headers
      user: {
        id: 2,
      },
    });

    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }

  // Code here
})();
