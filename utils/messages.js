export default class Homepage {
  static generateMessage = (username, text) => {
    return {
      username,
      text,
      createdAt: new Date().getTime(),
    };
  };

  static generateLocationMessage = (username, url) => {
    return {
      username,
      url,
      createdAt: new Date().getTime(),
    };
  };
}
