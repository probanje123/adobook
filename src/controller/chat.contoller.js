import userCon from "./users.controller.js";

let users;
let posts;
let chatDB;

function sortIt(a, b) {
  let result = "";
  let max = a.length >= b.length ? a.length : b.length;
  for (let i = 0; i < max; i++) {
    if (a[i] == undefined) {
      result = b + a;
      break;
    }
    if (b[i] == undefined) {
      result = a + b;
      break;
    }
    if (a[i] == b[i]) continue;
    if (a.charCodeAt(i) > b.charCodeAt(i)) {
      result = b + a;
      break;
    }
    if (b.charCodeAt(i) > a.charCodeAt(i)) {
      result = a + b;
      break;
    }
  }
  return result;
}

export default class Homepage {
  static async injectDB(conn) {
    if (users) {
      return;
    }
    try {
      users = await conn.db("project").collection("users");
      posts = await conn.db("project").collection("posts");
      chatDB = await conn.db("chats");
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in users collections: ${e}`
      );
    }
  }

  static async page(req, res) {
    res.render("chat.html");
  }

  static async getInfoChat(req, res) {
    let token = await userCon.decoded(req.cookies.token);
    let getFriends = await users
      .aggregate([
        {
          $match: {
            username: {
              $in: token.friends,
            },
          },
        },
      ])
      .toArray();
    for (let i of getFriends) {
      delete i.password;
    }
    token.friends = getFriends;
    // console.log(token);
    res.send(token);
  }

  static async getFriendsList(req, res) {
    let token = await userCon.decoded(req.cookies.token);
    let getFriends = await users
      .aggregate([
        {
          $match: {
            username: {
              $in: token.friends,
            },
          },
        },
        {
          $sort: {
            name: 1,
          },
        },
      ])
      .toArray();
    for (let i of getFriends) {
      delete i.password;
      delete i.friends;
    }

    res.send(getFriends);
  }

  static async sendMessage(req, res) {
    let token = await userCon.decoded(req.cookies.token);

    let user = await users.find({ username: req.body.user }).toArray();
    if (user[0].name == [] || !token.friends.includes(user[0].username))
      return res.send({ error: "User is not your friend" });

    let collection = sortIt(user[0].username, token.username);
    let listCollections = await chatDB.listCollections().toArray();
    let exist = false;
    let data = {
      sender: token.username,
      senders_name: token.name,
      date: new Date(),
      message: req.body.text,
      recipent: user[0].username,
      recipents_name: user[0].name,
    };
    for (let i of listCollections) {
      if (i.name == collection) exist = true;
    }
    if (!exist) {
      chatDB.createCollection(collection, function (err, response) {
        if (err) {
          return res.send({ error: "Error..." });
        }
      });
    }
    try {
      const response = await chatDB.collection(collection).insertOne(data);
      if (response.acknowledged == true) res.send(true);
    } catch (error) {
      return res.send({ error: "Error..." });
    }
  }
  static async getMessages(req, res) {
    let token = await userCon.decoded(req.cookies.token);
    let collection = sortIt(req.query.user, token.username);
    let listCollections = await chatDB.listCollections().toArray();
    let exist = false;

    for (let i of listCollections) {
      if (i.name == collection) exist = true;
    }
    if (!exist) {
      chatDB.createCollection(collection, function (err, res) {
        if (err) {
          if (
            !err
              .toString()
              .startsWith("MongoServerError: Collection already exists")
          ) {
            throw err;
          }
        }
        // console.log("Collection created!");
      });
    } else {
      let messages = await chatDB.collection(collection).find({}).toArray();
      return res.send(JSON.stringify(messages));
    }

    res.send(JSON.stringify(req.query.user));
  }
}
