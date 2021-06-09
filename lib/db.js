// Database
const constants = require("./constants.js");

class Database {
  constructor() {
    this.db=0;
    require('sqlite-async').open(constants.DATABASE_FILE).then(_db => { this.db = _db});
  }

  // Get FRONTPAGE_LIMIT number of results in order of newest first, where newest means the most recent to be promoted to the frotnpage.
  // Returns results as array
  async getFrontpage() {
    let results = await this.db.all("SELECT * FROM POSTS WHERE ISBBS=1 AND ISDELETED=0 ORDER BY BBSTIMESTAMP DESC LIMIT "+constants.FRONTPAGE_LIMIT);
    return results;
  }

  // Check if user is posting too frequently
  // Returns true or false
  async userCanPost(nick) {
    let results = await this.db.all("SELECT * FROM POSTS WHERE NICK = ? AND TIMESTAMP > ? AND ISDELETED = 0",nick,Math.floor(Date.now()/1000)-(60*constants.POST_TIME_BETWEEN));
    if(results.length > 0)
      return false;
    return true;
  }

  // Check if site is posting too frequently
  // Returns true or false
  async siteCanPost(url) {
    let results = await this.db.all("SELECT * FROM POSTS WHERE URL = ? AND TIMESTAMP > ? AND ISDELETED = 0",url.toLowerCase(),Math.floor(Date.now()/1000)-(60*60*24*constants.POST_TIME_BETWEEN_SITE));
    if(results.length>0)
      return false;
    return true;
  }

  // Post
  // Returns last id or 0
  async post(title,nick,url) {
    let results = await this.db.run("INSERT INTO POSTS (TITLE,NICK,URL,TIMESTAMP,ISBBS,ISDELETED) VALUES (?,?,?,?,?,?)",
                        title,nick,url,Math.floor(Date.now()/1000),0,0);
    if(results.lastID)
      return results.lastID;
    return 0;
  }

  // Check if post can be voted on
  // Returns 0 if old, -1 if same nick, -2 if already voted, 1 if user can vote.
  async userCanVoteForPost(pid,nick) {
    let results = await this.db.all("SELECT * FROM POSTS WHERE PID = ? AND TIMESTAMP > ? AND ISDELETED = 0",pid,Math.floor(Date.now()/1000)-60*constants.VOTE_TIMELIMIT);
    if(results.length === 0)
      return 0;
    if(results[0].NICK.toLowerCase()===nick.toLowerCase())
      return -1;
    results = await this.db.all("SELECT * FROM VOTES WHERE NICK = ? AND PID = ?",nick,pid);
    if(results.length > 0)
      return -2;
    return 1;
  }

  // Vote
  // Returns 2 if it updated the vote to frontpage, 1 if it just voted, 0 if the vote didnt work.
  async userVoteForPost(pid,nick) {
    let results = await this.db.run("INSERT INTO VOTES (PID,NICK) VALUES (?,?)",pid,nick);
    if(results.lastID) {
      results = await this.getVotes(pid);
      if(results.length==constants.VOTE_THRESHOLD) {
        results = await this.db.run("UPDATE POSTS SET ISBBS = ?, BBSTIMESTAMP = ? WHERE PID = ?",1,Math.floor(Date.now()/1000),pid);
        return 2;
      }
      else
        return 1;
    }
    return 0;
  }

  async getVotes(pid) {
    let results = await this.db.all("SELECT * FROM VOTES WHERE PID = ?",pid);
    return results;
  }

  // findPost
  // return post
  async findPost(pid) {
    let results = await this.db.all("SELECT * FROM POSTS WHERE PID = ? AND ISDELETED = 0",pid);
    if(results.length === 0)
      return 0;
    return results[0];
  }

  // addChit
  async addChit(pid,cid) {
    await this.db.run("UPDATE POSTS SET CID = ? WHERE PID = ?",cid,pid);
  }

  // deletePost
  // Deletes a post if it exists
  async delPost(pid) {
    await this.db.run("UPDATE POSTS SET ISDELETED = 1 WHERE PID = ?",pid);
  }

  // editPost
  // Edits a post if it exists
  async editPost(pid,title) {
    if(!this.findPost(pid))
      return 0;
    await this.db.run("UPDATE POSTS SET TITLE = ? WHERE PID = ?",title,pid);
  }

  // userIsRegistered
  // true or false
  async userIsRegistered(nick) {
    let results = await this.db.all("SELECT * FROM NICKS WHERE NICK = ?",nick.toLowerCase());
    if(results.length>0)
      return true;
    return false;
  }

  // userRegister
  async userRegister(nick) {
    if(await this.userIsRegistered(nick))
      return false;
    else {
      let results = await this.db.run("INSERT INTO NICKS (NICK) VALUES (?)",nick.toLowerCase());
      if(results.lastID)
        return true;
      return false;
    }
  }
};

module.exports = {
  Database
}
