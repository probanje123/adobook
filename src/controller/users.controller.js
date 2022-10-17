import bcrypt from "bcryptjs";
import validator from "validator";
import jwt from "jsonwebtoken";

let users;
const hashPassword = async (password) => await bcrypt.hash(password, 10);
async function encoded(obj) {
  return jwt.sign(obj, process.env.JWT_SECRET_KEY, {
    expiresIn: "7 days",
  });
}

export default class Users {
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      users = await conn.db(process.env.DB_NAME).collection("users");
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in users collections: ${e}`
      );
    }
  }

  static async decoded(userJwt) {
    try {
      let object = jwt.verify(userJwt, process.env.JWT_SECRET_KEY);
      delete object.iat;
      delete object.exp;
      return object;
    } catch (error) {
      return false;
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    let userData = await users.findOne({ email: email });
    if (userData == null) {
      return res.send({ errors: { error: "Bad email" } });
    }

    if (!(await bcrypt.compare(password, userData.password))) {
      return res.send({ errors: { error: "Password is not correct" } });
    }
    delete userData.password;
    res.cookie("token", await encoded(userData));
    return res.send(userData);
  }

  static async register(req, res) {
    const usersData = req.body;

    let errors = {};
    if (!validator.isEmail(usersData.email)) {
      errors.email = "Your email format is not correct.";
    }
    if (usersData.password.length < 8) {
      errors.password = "Your password must be at least 8 characters.";
    }
    if (usersData.name.length < 3) {
      console.log("aa");
      errors.name = "You must specify a name of at least 3 characters.";
    }
    if (usersData.username.length < 3) {
      errors.username = "You must specify a username of at least 3 characters.";
    }

    let check = await users
      .aggregate([
        {
          $match: {
            $or: [
              {
                username: usersData.username,
              },
              {
                name: usersData.name,
              },
            ],
          },
        },
      ])
      .toArray();
    if (check.length > 0) {
      errors.used = "Username or email is taken by another user";
    }
    if (Object.keys(errors).length > 0) {
      return res.send({ errors });
    }
    const userInfo = {
      ...usersData,
      password: await hashPassword(usersData.password),
      profilePicture: "default.jpg",
    };
    let insertResult;
    try {
      insertResult = await users.insertOne(userInfo);
      userInfo._id = insertResult.insertedId;
      delete userInfo.password;
      console.log(userInfo);
      res.cookie("token", await encoded(userInfo));
      return res.send(userInfo);
    } catch (e) {
      errors.e = "Internal error, please try again later";
      return res.status(400).json(errors);
    }
  }
}
