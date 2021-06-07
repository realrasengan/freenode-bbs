// User Input Constants
const TITLE_MIN_LENGTH = 10; // minimum title length
const POST_TIME_BETWEEN = 10; // minimum time between posts
const POST_TIME_BETWEEN_SITE = 1; // days between same url post

// User Input Voting Constants
const VOTE_THRESHOLD = 3; // threshold to get to bbs
const VOTE_TIMELIMIT = 60; // voting is only open for this long

// Front Page Constants
const FRONTPAGE_LIMIT = 50; // Number of posts to display

// Password
const PASSWORD_FILE = "/home/shellsuser/Software/newsbot/.password";

// Db
const DATABASE_FILE = '/home/shellsuser/Software/newsbot/bot.db';

// Output
const HTML_INDEX = "/home/shellsuser/Software/newsbot/output/index.html";
const RSS_INDEX = "/home/shellsuser/Software/newsbot/output/rss.xml";
const JSON_INDEX = "/home/shellsuser/Software/newsbot/output/index.json";

// Bold
const BOLD = String.fromCharCode(2);

// IRC
const IRC_SERVER = "chat.freenode.net";
const IRC_NICK = "NewsBot";
const IRC_USER = "newsbot";
const IRC_GECOS = "freenode BBS";
const IRC_CHAN_CONSOLE = "#freenode-bbs";
const IRC_CHAN_DISCUSSION = "#freenode-bbs-discussion";

module.exports = {
  TITLE_MIN_LENGTH,
  POST_TIME_BETWEEN,
  POST_TIME_BETWEEN_SITE,
  VOTE_THRESHOLD,
  VOTE_TIMELIMIT,
  FRONTPAGE_LIMIT,
  PASSWORD_FILE,
  DATABASE_FILE,
  HTML_INDEX,
  RSS_INDEX,
  JSON_INDEX,
  BOLD,
  IRC_SERVER,
  IRC_NICK,
  IRC_USER,
  IRC_GECOS,
  IRC_CHAN_CONSOLE,
  IRC_CHAN_DISCUSSION
}
