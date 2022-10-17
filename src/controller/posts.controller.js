import userCon from "./users.controller.js";
import moment from "moment";
import { ObjectId } from "mongodb";
import { response } from "express";
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

  static async getSearchResult(req, res) {
    let response = await users
      .find({ name: { $regex: `${req.body.input}`, $options: "i" } })
      .toArray();
    for (let i of response) console.log(i.name);
    res.send(response);
  }

  static async postComment(req, res) {
    try {
      let comment = await userCon.decoded(req.cookies.token);
      comment.comment = req.body.text;
      let response = await posts.findOneAndUpdate(
        { _id: ObjectId(req.body.id) },
        { $push: { comments: comment } }
      );
      res.send(comment);
    } catch (error) {
      console.log(error);
      res.send({
        error: { error: "Internal error, please try again later" },
      });
    }
  }
  static async showLikesAndComments(req, res) {
    try {
      let postInfo = await posts.findOne({ _id: ObjectId(req.body.id) });
      console.log(postInfo);
      res.send(postInfo);
    } catch (error) {
      console.log(error);
      res.send({
        error: { error: "Internal error, please try again later" },
      });
    }
  }

  static async like(req, res) {
    let id = req.body.id;

    try {
      let userInfo = await userCon.decoded(req.cookies.token);
      console.log(userInfo);
      let response = await posts.findOne({ _id: ObjectId(id) });
      let liked = false;
      for (let i of response.likes) {
        if (i._id == userInfo._id) liked = true;
      }
      // if (response.likes.includes(userInfo._id)) liked = true;
      if (liked) {
        let response = await posts.findOneAndUpdate(
          { _id: ObjectId(id) },
          { $pull: { likes: userInfo } },
          { returnDocument: "after" }
        );
        console.log(response.value);
        res.send(response.value);
      } else {
        let response = await posts.findOneAndUpdate(
          { _id: ObjectId(id) },
          { $push: { likes: userInfo } },
          { returnDocument: "after" }
        );
        console.log(response);
        console.log(response.value);
        res.send(response.value);
      }
    } catch (error) {
      res.send({
        error: { error: "Internal error, please try again later" },
      });
    }
  }

  static async getFriendsPosts(req, res) {
    let number = req.body.number;
    let user = await userCon.decoded(req.cookies.token);

    let skipPosts = 10 * (number - 1);
    let postPerPage = 10;
    let response = await posts

      .aggregate([
        {
          $match: {
            username: { $in: user.friends },
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
  static async getPostsGlobal(req, res) {
    let number = req.query.page;

    let skipPosts = 10 * (number - 1);
    let postPerPage = 10;
    let response = await posts

      .aggregate([
        {
          $match: {
            isGlobal: true,
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
        {
          $limit: postPerPage,
        },
      ])
      .toArray();
    console.log(response.length);
    res.status(200).send(response);
  }
  static async post(req, res) {
    let text = req.body.text;
    let global = req.body.isGlobal == true ? true : false;
    let userInfo = await userCon.decoded(req.cookies.token);
    delete userInfo.password;
    delete userInfo.friends;
    let date = moment().format();
    let data = {
      name: userInfo.name,
      userId: userInfo._id,
      email: userInfo.email,
      text: text,
      date: new Date(date),
      likes: [],
      comments: [],
      username: userInfo.username,
      isGlobal: global,
      user: userInfo,
      profilePicture: userInfo.profilePicture,
    };

    try {
      const response = await posts.insertOne(data);
      const currentPost = await posts
        .aggregate([
          { $match: { _id: response.insertedId } },
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
      return res.send(currentPost[0]);
    } catch (e) {
      console.log(e);
      res.send({
        error: { error: "Internal error, please try again later" },
      });
    }
  }
}
