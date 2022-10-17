import { log } from "console";
import fs from "fs";
import controller from "./controllerr.js";
import userCon from "./users.controller.js";

let users;
let posts;
export default class Homepage {
  static async injectDB(conn) {
    try {
      users = await conn.db("project").collection("users");
      posts = await conn.db("project").collection("posts");
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in users collections: ${e}`
      );
    }
  }
  static async getUserDate(username) {
    let response = await users.find({ username }).toArray();
    // console.log(response);
    return response[0];
  }
  static async getProfile(req, res) {
    // getProfileInfo;
    console.log(req.body);

    res.render("profile.html");
  }

  static async redirectToHomepage(req, res) {
    console.log("da");
  }
  static async getProfileInfo(req, res) {}
  static async getInfoAboutProfile(req, res) {
    let response = await users
      .find({ username: req.body.profileName })
      .toArray();
    try {
      let response = await users
        .find({ username: req.body.profileName })
        .toArray();
      delete response[0].password;
      delete response[0]._id;
      return res.send(response[0]);
    } catch (error) {
      return res.send(false);
    }
  }
  static async accept(req, res) {
    let user = req.body.user;
    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(user);
    if (userInfo.friends_request.includes(user)) {
      let addFriend = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $push: { friends: user },
        }
      );
      let removeFriend_request = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $pull: { friends_request: user },
        }
      );
      let addUserFriend = await users.updateOne(
        {
          username: user,
        },
        {
          $push: { friends: userInfo.username },
        }
      );
      let removeUserFriend_pending = await users.updateOne(
        {
          username: user,
        },
        {
          $pull: { friends_pending: userInfo.username },
        }
      );

      if (
        addFriend.modifiedCount == true &&
        removeFriend_request.modifiedCount == true &&
        addUserFriend.modifiedCount == true &&
        removeUserFriend_pending.modifiedCount == true
      ) {
        return res.send({ response: "success" });
      } else return res.send({ response: false });
    }
  }
  static async decline(req, res) {
    let user = req.body.user;
    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(user);
    if (userInfo.friends_request.includes(user)) {
      let declineFriend = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $pull: { friends_request: user },
        }
      );
      let declineUserFriend = await users.updateOne(
        {
          username: user,
        },
        {
          $pull: { friends_pending: userInfo.username },
        }
      );
      console.log(declineFriend);
      console.log(declineUserFriend);
      if (
        declineFriend.modifiedCount == 1 &&
        declineUserFriend.modifiedCount == 1
      ) {
        return res.send({ response: "success" });
      } else return res.send({ response: false });
    }
  }
  static async removeFriend(req, res) {
    let user = req.body.user;
    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(user);
    if (userInfo.friends.includes(user)) {
      let removeFriend = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $pull: { friends: user },
        }
      );
      let removeUserFriend = await users.updateOne(
        {
          username: user,
        },
        {
          $pull: { friends: userInfo.username },
        }
      );
      if (
        removeFriend.modifiedCount == 1 &&
        removeUserFriend.modifiedCount == 1
      ) {
        return res.send({ response: "success" });
      } else return res.send({ response: false });
    }
  }
  static async removePending(req, res) {
    let user = req.body.user;
    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(user);
    if (userInfo.friends_pending.includes(user)) {
      let removePending = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $pull: { friends_pending: user },
        }
      );
      let removeUserRequest = await users.updateOne(
        {
          username: user,
        },
        {
          $pull: { friends_request: userInfo.username },
        }
      );

      if (
        removePending.modifiedCount == 1 &&
        removeUserRequest.modifiedCount == 1
      ) {
        return res.send({ return: "success" });
      } else return res.send({ return: false });
    }
  }

  static async addFriend(req, res) {
    let user = req.body.user;
    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(user);
    if (
      !userInfo.friends.includes(user) &&
      !userInfo.friends_request.includes(user) &&
      !userInfo.friends_pending.includes(user)
    ) {
      let addFriend = await users.updateOne(
        {
          username: userInfo.username,
        },
        {
          $push: { friends_pending: user },
        }
      );
      let addUserFriend = await users.updateOne(
        {
          username: user,
        },
        {
          $push: { friends_request: userInfo.username },
        }
      );

      if (addFriend.modifiedCount == 1 && addUserFriend.modifiedCount == 1) {
        return res.send({ return: "success" });
      } else return res.send({ return: false });
    }
  }
  static async getProfilePosts(req, res) {
    let number = req.body.number;

    let userInfo = await userCon.decoded(req.cookies.token);
    userInfo = await Homepage.getUserDate(userInfo.username);
    console.log(userInfo);
    let username = req.body.profileName;
    if (userInfo.friends_request.includes(username)) {
      return res.send({ return: "request" });
    }

    if (userInfo.friends_pending.includes(username)) {
      return res.send({ return: "pending" });
    }

    if (!userInfo.friends.includes(username)) {
      return res.send({ return: false });
    }

    if (userInfo.friends.includes(username)) {
      let skipPosts = 10 * (number - 1);
      let postPerPage = 10;
      let response = await posts
        .aggregate([
          {
            $match: {
              username: username,
            },
          },
          {
            $sort: {
              date: -1,
            },
          },
          {
            $skip: skipPosts,
          },
          {
            $limit: postPerPage,
          },
          {
            $lookup: {
              from: "users",
              localField: "email",
              foreignField: "email",
              as: "user",
            },
          },
          {
            $unwind: {
              path: "$user",
            },
          },
        ])
        .toArray();

      res.status(200).send(response);
    }
  }
}
