import { Router } from "express";
import { MongoClient } from "mongodb";
import page from "./page.js";
import users from "./users.controller.js";
import posts from "./posts.controller.js";
import chat from "./chat.contoller.js";
import profile from "./profile.controller.js";
import dotenv from "dotenv";
dotenv.config();
const router = new Router();

MongoClient.connect(process.env.DB_URI)
  .catch((err) => {
    console.error(err.stack);
    process.exit(1);
  })
  .then(async (client) => {
    await page.injectDB(client),
      await users.injectDB(client),
      await posts.injectDB(client),
      await profile.injectDB(client),
      await chat.injectDB(client);
  });
//page controller
router.route("/").get(page.homepage);
router.route("/getInfoAboutUser").get(page.homepage);
//post controller
router.route("/like").post(posts.like);
router.route("/getPosts").get(posts.getPostsGlobal);
router.route("/post").post(posts.post);
router.route("/getFriendsPosts").post(posts.getFriendsPosts);
router.route("/getSearchResult").post(posts.getSearchResult);
router.route("/showLikesAndComments").post(posts.showLikesAndComments);
router.route("/postComment").post(posts.postComment);
//users controller
router.route("/login").post(users.login);
router.route("/register").post(users.register);
//profile controller
router.route("/redirectToHomepage").get(profile.redirectToHomepage);
router.route("/profile/:id?").get(profile.getProfile);
router.route("/getProfilePosts").post(profile.getProfilePosts);
router.route("/accept").post(profile.accept);
router.route("/decline").post(profile.decline);
router.route("/addFriend").post(profile.addFriend);
router.route("/removePending").post(profile.removePending);
router.route("/removeFriend").post(profile.removeFriend);
router.route("/getInfoAboutProfile").post(profile.getInfoAboutProfile);
router.route("/getProfileInfo").post(profile.getProfileInfo);
//chat controller
router.route("/chat").get(chat.page);
router.route("/getInfoChat").get(chat.getInfoChat);
router.route("/getMessages").get(chat.getMessages);
router.route("/sendMessage").post(chat.sendMessage);
router.route("/getFriendsList").get(chat.getFriendsList);

export default router;
