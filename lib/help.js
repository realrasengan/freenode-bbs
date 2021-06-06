const header = `**** NewsBot Help ****`;
const footer = `**** End of Help ****`;

const help = `NewsBot is the central command for https://bbs.freenode.net - the following commands are available:
POST - Post a URL
VOTE - Vote on a POST
DEL - Delete a POST
EDIT - Edit a POST (@ only)
You can also get more information with HELP <command>
**** End of Help ****`;

const post = `POST lets you POST a URL
Syntax: POST <url> <title>
Example: POST https://www.freenode.net/ freenode is the home of FOSS`;

const vote = `VOTE lets you VOTE for a POST
Syntax: VOTE <post id>
Example: VOTE 1135`;

const del = `DEL lets you delete a POST if you're an @ or the ORIGINAL POSTER
Syntax: DEL <post id>
Only ops and the original poster can delete a post
Example: DEL 1135`;

const edit = `EDIT lets you edit a POST title if you're an @
Syntax: EDIT <post id> New Title
Only ops can edit a post
Example: EDIT 29 Better title`;

const none = `No such command `;

module.exports = {
  header,
  footer,
  help,
  post,
  vote,
  del,
  edit,
  none
}
