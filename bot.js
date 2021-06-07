const fs = require('fs');
const psl = require('psl');
const striptags = require('striptags');
const timeago = require('timeago.js');

const rss = require('./lib/rss.js'); // rss feed
const util = require('./lib/util.js');  // random functions
const Help = require('./lib/help.js');  // help text
const constants = require('./lib/constants.js');  // constants and settings
const IRC = new (require('./lib/irc.js')).IRC();  // irc client, connected
const Database = new (require('./lib/db.js')).Database();  // database, connected

// Hack
// TODO: Better way to ensure one instance of bot only (pid file method breaks if process exits unexpectedly)
var app = require('express')();
app.listen(22533);


// Main listener
IRC.addListener('raw',async (message) => {
  console.log(message);
  if(message.command==='PRIVMSG' &&
    (message.args[0].toLowerCase()==='@'+constants.IRC_CHAN_CONSOLE.toLowerCase() || message.args[0].toLowerCase()===constants.IRC_CHAN_CONSOLE.toLowerCase())) {
    if(await Database.userIsRegistered(message.nick))
      parse(message.nick,message.args[1],(message.args[0].substr(0,1)=='#'));
  }
  else if(message.command==='JOIN') {
    if(!await Database.userIsRegistered(message.nick))
      IRC.whois(message.nick);
    else
      IRC.notice(message.nick,"Welcome back!");
  }
  else if(message.command==='330') {
    if(message.args[1].toLowerCase()!==message.args[2].toLowerCase()) {
      IRC.mode(constants.IRC_CHAN_CONSOLE,'+b',message.args[1]+"!*@*");
      IRC.mode(constants.IRC_CHAN_DISCUSSION,'+b',message.args[1]+"!*@*");
      IRC.remove(constants.IRC_CHAN_CONSOLE,message.args[1],"Sorry, but only primary nicks may join this channel.");
      IRC.remove(constants.IRC_CHAN_DISCUSSION,message.args[1],"Sorry, but only primary nicks may join this channel.");
      setTimeout(() => {
        IRC.mode(constants.IRC_CHAN_CONSOLE,'-b',message.args[1]+"!*@*");
        IRC.mode(constants.IRC_CHAN_DISCUSSION,'-b',message.args[1]+"!*@*");
      },10000);
    }
    else {
      if(await Database.userRegister(message.args[2]))
        IRC.notice(message.args[2],"You have been added to the verified user database.");
    }
  }
});

// Main bot processor
async function parse(from,msg,isop) {
  msg=msg.split(" ");
  switch(msg[0].toLowerCase()) {
    case "help":
      if(!msg[1])
        IRC.notice_chan(from,Help.help,constants.IRC_CHAN_CONSOLE);
      else {
        IRC.notice_chan(from,Help.header,constants.IRC_CHAN_CONSOLE);
        switch(msg[1].toLowerCase()) {
          case 'post':
            IRC.notice_chan(from,Help.post,constants.IRC_CHAN_CONSOLE);
            break;
          case 'vote':
            IRC.notice_chan(from,Help.vote,constants.IRC_CHAN_CONSOLE);
            break;
          case 'del':
            IRC.notice_chan(from,Help.del,constants.IRC_CHAN_CONSOLE);
            break;
          case 'edit':
            IRC.notice_chan(from,Help.edit,constants.IRC_CHAN_CONSOLE);
            break;
          default:
            IRC.notice_chan(from,Help.none+msg[1]);
            break;
        }
        IRC.notice_chan(from,Help.footer,constants.IRC_CHAN_CONSOLE);
      }
      break;
    case 'post':
      if(!await Database.userCanPost(from))
        IRC.notice_chan(from,"Sorry, you can only post one post per "+constants.POST_TIME_BETWEEN+" minutes",constants.IRC_CHAN_CONSOLE);
      else if(msg.length<3)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN_CONSOLE);
      else if(striptags(msg[1])!==msg[1])
        IRC.notice_chan(from,"Sorry, but these characters are not allowed in a post.",constants.IRC_CHAN_CONSOLE);
      else if(util.validURL(msg[1])) {
        let url = msg[1];
        msg.shift();
        msg.shift();
        title=msg.join(" ");
        if(title.length<constants.TITLE_MIN_LENGTH) {
          IRC.notice_chan(from,"Title must be > "+constants.TITLE_MIN_LENGTH+" chars",constants.IRC_CHAN_CONSOLE);
        }
        else if(striptags(title)!==title||title.replace(/[^a-zA-Z\,\-\.\'\" ]/g,"")!==title)
          IRC.notice_chan(from,"Sorry, but these characters are not allowed in a title.",constants.IRC_CHAN_CONSOLE);
        else {
          if(!await Database.siteCanPost(url.toLowerCase()))
            IRC.notice_chan(from,"This site is being posted too often.",constants.IRC_CHAN_CONSOLE);
          else {
            result = await Database.post(title,from,url);
            if(result)
              IRC.say(constants.IRC_CHAN_CONSOLE,constants.BOLD+'['+result+'] '+IRC.colour.red(title)+' '+IRC.colour.grey('['+from+']')+' '+IRC.colour.underline.blue(url)+constants.BOLD);
            else
              IRC.notice_chan(from,"An unknown error has occurred.",constants.IRC_CHAN_CONSOLE);
          }
        }
      }
      else
        IRC.notice_chan(from,"Invalid URL",constants.IRC_CHAN_CONSOLE);
      break;
    case 'vote':
      if(msg.length<2)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN_CONSOLE);
      else {
        result = await Database.userCanVoteForPost(msg[1],from);
        switch(result) {
          case 0:
            IRC.notice_chan(from,"That post does not exist or is too old to vote on.",constants.IRC_CHAN_CONSOLE);
            break;
          case -1:
            IRC.notice_chan(from,"You cannot vote for your own post.",constants.IRC_CHAN_CONSOLE);
            break;
          case -2:
            IRC.notice_chan(from,"You can only vote once per post",constants.IRC_CHAN_CONSOLE);
            break;
          case 1:
            vote = await Database.userVoteForPost(msg[1],from);
            switch(vote) {
              case 0:
                IRC.notice_chan(from,"An unknown error has occurred.",constants.IRC_CHAN_CONSOLE);
                break;
             case 1:
                IRC.say(constants.IRC_CHAN_CONSOLE,constants.BOLD+'['+Math.round(msg[1])+'] Vote recorded from '+from+constants.BOLD);
                break;
              case 2:
                let post_data = await Database.findPost(Math.round(msg[1]));
                IRC.say(constants.IRC_CHAN_CONSOLE,constants.BOLD+'['+Math.round(msg[1])+'] Vote recorded from '+from+constants.BOLD);
                IRC.say(constants.IRC_CHAN_DISCUSSION,constants.BOLD+'['+post_data.PID+'] '+IRC.colour.red(post_data.TITLE)+' '+IRC.colour.grey('['+post_data.NICK+']')+' '+IRC.colour.underline.blue(post_data.URL)+constants.BOLD);
                break;
            }
            break;
        }
      }
      break;
    case 'del':
      if(msg.length < 2)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN_CONSOLE);
      else {
        result = await Database.findPost(msg[1]);
        if(!result)
          IRC.notice_chan(from,"That post does not exist or was already posted on the BBS.",constants.IRC_CHAN_CONSOLE);
        else if(result.NICK.toLowerCase()===from.toLowerCase() && !result.ISBBS && !isop) {
          await Database.delPost(msg[1]);
          IRC.notice_chan(from,"Post has been deleted.",constants.IRC_CHAN_CONSOLE);
          IRC.say(constants.IRC_CHAN_CONSOLE,"Post ["+msg[1]+"] has been deleted by the original poster.");
        }
        else if(isop) {
          await Database.delPost(msg[1]);
          IRC.notice_chan(from,"Post has been deleted.",constants.IRC_CHAN_CONSOLE);
          IRC.say(constants.IRC_CHAN_CONSOLE,"Post ["+msg[1]+"] has been deleted.");
        }
        else {
          IRC.notice_chan(from,"You do not have permission to delete that post.",constants.IRC_CHAN_CONSOLE);
        }
      }
      break;
    case 'edit':
      if(msg.length < 3)
        IRC.notice_chan(from,"Syntax error.  Try 'help'",constants.IRC_CHAN_CONSOLE);
      else {
        let title=msg;
        let pid=msg[1];
        title.shift();
        title.shift();
        title=title.join(" ");
        result = await Database.findPost(msg[1]);
        if(!result)
          IRC.notice_chan(from,"That post does not exist or was already posted on the BBS.",constants.IRC_CHAN_CONSOLE);
        else if(isop) {
          if(striptags(title)!==title || title.replace(/[^a-zA-Z\,\-\.\'\" ]/g,"")!==title)
            IRC.notice_chan(from,"Sorry, but these characters are not allowed in a title.",constants.IRC_CHAN_CONSOLE);
          else {
            await Database.editPost(pid,title);
            IRC.notice_chan(from,"Post has been updated.",constants.IRC_CHAN_CONSOLE);
            IRC.say(constants.IRC_CHAN_CONSOLE,"Post ["+pid+"] has been updated.");
          }
        }
        else
          IRC.notice_chan(from,"You do not have permission to edit that post.",constants.IRC_CHAN_CONSOLE);
      }
      break;
    default:
      break;
  }
};

// Web page updater
setInterval(async () => {
  let bbs = await Database.getFrontpage();
  let output="";
  for(x=0;x<bbs.length;x++) {
    output+="<tr><td class='number'>"+(x+1)+"</td><td class='website'><a href='"+bbs[x].URL+"' target='_new'>"+striptags(bbs[x].TITLE)+"</a> <small>("+psl.get(util.extractHostname(bbs[x].URL))+")</small><br><small>Submitted by <u>"+bbs[x].NICK+"</u> about "+timeago.format(bbs[x].BBSTIMESTAMP*1000)+"</small></td></tr>";
  }
  fs.writeFileSync(constants.HTML_INDEX,output);
  fs.writeFileSync(constants.JSON_INDEX,JSON.stringify(bbs));
  fs.writeFileSync(constants.RSS_INDEX,rss.createRSS(bbs));
},5000,Database,constants);

