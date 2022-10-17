import bcrypt from "bcryptjs";
import userCon from "./users.controller.js";
let users;
let posts;
export default class Homepage {
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      users = await conn.db("project").collection("users");
      posts = await conn.db("project").collection("posts");
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in users collections: ${e}`
      );
    }
  }
  static async homepage(req, res) {
    let returnObject = false;
    if (req.query.get == "yes") returnObject = true;
    let token = await userCon.decoded(req.cookies.token);
    if (token) {
      if (returnObject) {
        return res.send(token);
      }
      return res.render("index.html");
    }
    res.render("login.html");
  }
}
