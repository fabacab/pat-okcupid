/**
 *
 * This is a Greasemonkey script and must be run using a Greasemonkey-compatible browser.
 *
 * @author maymay <bitetheappleback@gmail.com>
 */
// ==UserScript==
// @name           Predator Alert Tool for OkCupid
// @version        0.2
// @namespace      com.maybemaimed.pat.okcupid
// @updateURL      https://userscripts.org/scripts/source/TK.user.js
// @description    Alerts you of potential sexual predators on OkCupid based on their own answers to Match Questions patterned after Lisak and Miller's groundbreaking academic work on identifying "undetected rapists."
// @include        http://www.okcupid.com/*
// @grant          GM_log
// @grant          GM_xmlhttpRequest
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// ==/UserScript==

var OKCPAT = {};
OKCPAT.CONFIG = {
    'debug': false, // switch to true to debug.
    'storage_server_url': 'http://okcupid-pat.appspot.com/okcupid_pat', // Our centralized database.
    'storage_server_url_development': 'http://localhost:8080/okcupid_pat', // A dev server, for when 'debug' is true.
    'red_flag_suggestion_form_url': 'https://docs.google.com/forms/d/15zyiFLP71Qtl6eVtACjg2SIaV9ZKAv3DpcK0d_9_Qnc/viewform',
    'red_flag_suggestion_form_url_development': 'https://docs.google.com/forms/d/1vddPhUKBq08yhaWgCQvtMCWoUA6YFIFV9rH9OAz9PsM/viewform',
    // TODO: A configuration option to select active sets?
    //'active_topics': [], // List of topics to match questions against.
    // Define list of flagged Lisak and Miller Q&A's by OkCupid Question IDs.
    // TODO: Define more, topical "flagged_qs_*" sets of alert-worthy Q&A's.
    'flagged_qs_sexual_consent': {
        // QID : Answer
        // These are the critical Lisak and Miller questions.
        421567 : 'Yes',
        423365 : 'Yes',
        421568 : 'Yes',
        421570 : 'Yes',
        421572 : 'Yes',
        421574 : 'Yes',
        421577 : 'Yes',
        423366 : 'Yes',
        423369 : 'Yes',
        // These are additional concerning questions which could eventually be
        // moved to their own sets once that feature is implemented.
        55349 : 'Yes.', // Have you ever thrown an object in anger during an argument?
        // TODO: Support checking against MULTIPLE concerning answers.
        36624 : [ // Are you ever violent with your friends?
            'Yes, I use physical force whenever I want.',
            'Yes, but only playfully or in jest.'
        ]
    },
//    // TODO: Support multiple lists of questions?
//    'flagged_qs_violence': {
//        55349 : 'Yes.',
//        // TODO: Support checking against MULTIPLE concerning answers.
//        36624 : ['Yes, I use physical force whenever I want.', 'Yes, but only playfully or in jest.']
//    },
//    'flagged_qs_polyamory': {
//        784 : 'No',
//        31581 : 'No way.'
//    },
    'flagged_qs_development': {
        784 : 'No',
        31581 : 'No way.'
    }
};

// Utility debugging function.
OKCPAT.log = function (msg) {
    if (!OKCPAT.CONFIG.debug) { return; }
    GM_log('PAT-OkCupid: ' + msg);
};

// Initializations.
// Don't run in frames.
if (window.top !== window.self) {
    OKCPAT.log('In frame on page ' + window.location.href + ' (Aborting.)');
    return;
}
var uw = unsafeWindow || window; // Help with Chrome compatibility?
GM_addStyle('\
.okcpat_red_flagged, #okcpat_warning { border: 3px solid red; }\
#okcpat_warning { padding: 25px; }\
#okcpat_warning p { margin: 1em 0; }\
#okcpat_warning dl { counter-reset: item; }\
#okcpat_warning dt:before {\
    counter-increment: item;\
    content: counter(item)". ";\
}\
#okcpat_warning dd { margin: 0 0 1em 3em; }\
');
OKCPAT.init = function () {
    // TODO: Create an "install" screen so that users initiall answer the
    //       questions we need to scrape. And so they understand this thing!
    if (false === OKCPAT.isFirstRun()) {
        OKCPAT.doFirstRun();
    }
    // TODO: Define a UI for choosing topic lists?
//    OKCPAT.CONFIG.active_topics.push('sexual_consent');
//    OKCPAT.CONFIG.active_topics.push('polyamory');
    OKCPAT.main();
};
window.addEventListener('DOMContentLoaded', OKCPAT.init);

OKCPAT.isFirstRun = function () {
    return (OKCPAT.getValue('completed_first_run_questionnaire')) ? true : false;
};
OKCPAT.getServerUrl = function (path) {
    path = path || '';
    return (OKCPAT.CONFIG.debug) ?
        OKCPAT.CONFIG.storage_server_url_development + path:
        OKCPAT.CONFIG.storage_server_url + path;
};
OKCPAT.getSuggestionFormUrl = function () {
    return (OKCPAT.CONFIG.debug) ?
        OKCPAT.CONFIG.red_flag_suggestion_form_url_development:
        OKCPAT.CONFIG.red_flag_suggestion_form_url;
};
OKCPAT.setValue = function (x, y) {
    return (OKCPAT.CONFIG.debug) ?
        GM_setValue(x += '_development', y) :
        GM_setValue(x, y);
};
OKCPAT.getValue = function (x, y) {
    if (arguments.length === 1) {
        return (OKCPAT.CONFIG.debug) ?
            GM_getValue(x += '_development'):
            GM_getValue(x);
    } else {
        return (OKCPAT.CONFIG.debug) ?
            GM_getValue(x += '_development', y):
            GM_getValue(x, y);
    }
};
OKCPAT.deleteValue = function (x) {
    return (OKCPAT.CONFIG.debug) ?
        GM_deleteValue(x += '_development'):
        GM_deleteValue(x);
};

OKCPAT.getFlaggedQs = function () {
    return (OKCPAT.CONFIG.debug) ?
        OKCPAT.CONFIG['flagged_qs_development']:
        OKCPAT.CONFIG['flagged_qs_sexual_consent'];
};

OKCPAT.makeMatchQuestionsPermalinks = function () {
    var els = document.querySelectorAll('#questions .qtext');
    for (var i = 0; i < els.length; i++) {
        var txt = els[i].innerHTML;
        var qid = els[i].getAttribute('id').split('_')[1];
        var a_html = '<a href="/questions?rqid=' + encodeURIComponent(qid.toString()) + '">' + txt + '</a>';
        els[i].innerHTML = a_html;
    }
};

// This expects JSON-formatted data.
// TODO: Add some error-handling to these functions?
OKCPAT.saveLocally = function (key, data) {
    return OKCPAT.setValue(key, JSON.stringify(data));
};
OKCPAT.readLocally = function (key) {
    return (OKCPAT.getValue(key)) ?
        JSON.parse(OKCPAT.getValue(key)):
        false;
};
OKCPAT.deleteLocally = function (key) {
    return OKCPAT.deleteValue(key);
};

// NOTE: "target" = other user, "my" = logged-in user
OKCPAT.getMyUserId = function () {
    return uw.CURRENTUSERID;
};
OKCPAT.getMyScreenname = function () {
    return uw.SCREENNAME;
};
OKCPAT.getTargetUserId = function (html) {
    if (!html) {
        OKCPAT.log('No HTML source code string passed, using active script values.');
        return uw.user_info.userid;
    } else {
        OKCPAT.log('An HTML source code string was passed, parsing string values.');
        var m = html.match(/"userid"\s*:\s*"(\d+)"/);
        return (m) ? m[1] : false ;
    }
};
OKCPAT.getTargetScreenname = function () {
    return uw.user_info.screenname;
};
OKCPAT.isTargetMe = function () {
    return (this.getMyUserId() === this.getTargetUserId()) ? true : false;
};

// Scrape a page of Match Questions for a particular screenname, then recurse.
// Note this sends JSON data to the server in batches of up to 10 questions.
OKCPAT.scrapeMatchQuestionsPage = function (screenname, page_num) {
    var page_num = page_num || 1; // Start at 1 if no page_num was passed.
    var url = window.location.protocol + '//' + window.location.host + '/profile/'
        + screenname + '/questions?low=' + page_num.toString();
    GM_xmlhttpRequest({
        'method': 'GET',
        'url': url,
        'onload': function (response) {
            // Find only the answered questions, since those are what we can scrape.
            var result_count = 0;

            var parser = new DOMParser();
            var doc = parser.parseFromString(response.responseText, 'text/html');
            var targetid = OKCPAT.getTargetUserId(response.responseText);
            var answered_questions = doc.querySelectorAll('.question.public:not(.not_answered)');
            var data = OKCPAT.processAnsweredQuestions(answered_questions, targetid, screenname);

            // Note how many answers we've been able to scrape.
            result_count += data.answers.length;

            var my_page = (url.match(/low=(\d+)/)) ? parseInt(url.match(/low=(\d+)/)[1]) : 1 ;
            if (result_count) {
                OKCPAT.saveToServer(data);
                // TODO: Also save locally, with timestamp noting last scrape time.
                data.last_scraped = new Date().getTime();
//                var data = (OKCPAT.readLocally(targetid)) ?
//                    OKCPAT.readLocally(targetid).concat(data) :
//                    data;
//                OKCPAT.saveLocally(targetid, data);

                // We got answers from the processed page, so grab the next page, too.
                var next_page = my_page + 10; // OkCupid increments by 10 questions per page.
                OKCPAT.log('Got ' + result_count.toString() + ' answers, next page starts at ' + next_page.toString());
                OKCPAT.scrapeMatchQuestionsPage(screenname, next_page);
            } else {
                OKCPAT.log('No Match Questions found on page ' + my_page.toString() + ', stopping.');
                // Now that we've scraped what we can, let's ask the server to
                // check if it knows of more answers we couldn't find, and save those.
                OKCPAT.getQuestionsAnsweredByUserId(targetid);
            }
            return;
        }
    });
};

OKCPAT.processAnsweredQuestions = function (els, targetid, targetsn) {
    var r = {'userid' : targetid, 'screenname' : targetsn};
    var arr_qs = [];
    // for each answered question on this page,
    for (var i = 0; i < els.length; i++) {
        var qid    = els[i].getAttribute('id').match(/\d+$/)[0];
        var qtext  = els[i].querySelector('#qtext_' + qid).childNodes[0].textContent;
        var answer = els[i].querySelector('#answer_target_' + qid).childNodes[0].textContent;
        // TODO: Ask the server if we've already got a match for question X with answer Y.
        // If we don't, send this information to the server for storage.
        arr_qs.push({'qid' : qid, 'qtext' : qtext, 'answer' : answer});
    }
    r.answers = arr_qs;
    return r;
};

OKCPAT.saveToServer = function (data) {
    GM_xmlhttpRequest({
        'method': 'POST',
        'url': OKCPAT.getServerUrl(),
        'headers': {
            'Content-Type': 'application/json'
        },
        'data': JSON.stringify(data),
        'onload': function (response) {
            // TODO: Offer some kind of UI to indicate we've done this?
            OKCPAT.log('OKCPAT.saveToServer(): Received response ' + response.responseText);
        }
    });
};


OKCPAT.getQuestionsAnsweredByUserId = function (userid) {
    GM_xmlhttpRequest({
        'method': 'GET',
        'url': OKCPAT.getServerUrl('/' + userid),
        'onload': function (response) {
            var json = JSON.parse(response.responseText);
            if (json) {
                // add a timestamp of when we last fetched this user's info.
                json.last_fetched = new Date().getTime();
                OKCPAT.saveLocally(json.screenname, json);
            }
            // TODO: then we need to start looking for questions that match any of
            // the appropriate pre-defined lists.
            // TODO: Create a local variable store for the right Question IDs.
        }
    });
};

// This is the main() function, executed on page load.
OKCPAT.main = function () {
    var myid = OKCPAT.getMyUserId();
    var mysn = OKCPAT.getMyScreenname();
    var names = OKCPAT.findUsersOnPage();
    var red_flags = {};
    // For each of the OkCupid Users found,
    for (var i = 0; i < names.length; i++) {
        // begin scraping their Match Questions.
        OKCPAT.log('Beginning scraping Match Questions answered by ' + names[i]);
        OKCPAT.scrapeMatchQuestionsPage(names[i]);

        // Read the list of questions answered by this user, if we remember any.
        var data = OKCPAT.readLocally(names[i]);
        if (data) {
            // TODO: How are we going to figure out which are the appropriate set of questions?
            //       We could:
            //           * Define a set of built-ins?
            // Get a list of the flagged question IDs, as strings
            var k = Object.keys(OKCPAT.getFlaggedQs());
            // and a list of the answered question IDs, also as strings.
            var a = [];
            for (var y in data.answers) {
                a.push(String(data.answers[y].qid));
            }
            // Search the answered questions for one of the flagged ones.
            for (var y = 0; y < k.length; y++) {
                // If that person has answered one of a set of flagged questions,
                var x = a.indexOf(k[y]);
                if (-1 !== x) {
                    // check their answer and, if it's concering,
                    if (data.answers[x].answer.trim() === OKCPAT.getFlaggedQs()[k[y]].trim()) {
                        OKCPAT.log('Found concering answer in Question ID ' + data.answers[x].qid + ' by user ' + names[i]);
                        // add the answer to their set of red flags.
                        if (names[i] in red_flags) {
                            red_flags[names[i]].push({
                                'qid' : data.answers[x].qid,
                                'qtext' : data.answers[x].qtext,
                                'answer' : data.answers[x].answer
                            });
                        } else {
                            red_flags[names[i]] = [{
                                'qid' : data.answers[x].qid,
                                'qtext' : data.answers[x].qtext,
                                'answer' : data.answers[x].answer
                            }];
                        }
                        OKCPAT.flagUser(names[i]);
                    }
                }
            }
        }
    }
    // If we're on a flagged user's profile page,
    var m = window.location.pathname.match(/^\/profile\/([^?\/]+)/);
    if (m && (m[1] in red_flags)) {
        // Grab the target IDs here.
        var targetid = OKCPAT.getTargetUserId();
        var targetsn = OKCPAT.getTargetScreenname();
        OKCPAT.log('Loading profile page for ' + targetsn + ' (userid: ' + targetid + ').');
        // Show the details of the flagged Questions answered by this user.
        var div = document.createElement('div');
        div.setAttribute('id', 'okcpat_warning');
        div.setAttribute('class', 'content');
        var a_hdr = document.createElement('a');
        a_hdr.setAttribute('class', 'essay_title');
        a_hdr.innerHTML = 'OkCupid Predator Alert Warning!';
        div.appendChild(a_hdr);
        var txt_el = document.createElement('div');
        txt_el.setAttribute('class', 'text');
        var p = document.createElement('p');
        // TODO: Variablize this so it reads "NAME answered NUMBER questions about TOPIC in a concerning way..."
        p.innerHTML = targetsn + ' answered the following questions in a concering way:';
        txt_el.appendChild(p);
        div.appendChild(txt_el);
        var dl = document.createElement('dl');
        // For each of the flagged questions,
        for (var z = 0; z < red_flags[targetsn].length; z++) {
            // create a <dd> element and an associated <dt> element
            var dt = document.createElement('dt');
            dt.innerHTML = red_flags[targetsn][z].qtext;
            dl.appendChild(dt);
            var dd = document.createElement('dd');
            dd.innerHTML = red_flags[targetsn][z].answer;
            dl.appendChild(dd);
        }
        div.appendChild(dl);
        // Display this information at the top of the user's profile.
        var before = document.getElementById('essay_0');
        before.parentNode.insertBefore(div, before);
    }
    // If there are any questions the human user can see, offer a
    var q = document.querySelectorAll('.question');
    if (q.length) {
        OKCPAT.makeMatchQuestionsPermalinks();
        // link to suggest adding this question to the list of red flags.
        for (var i = 0; i < q.length; i++) {
            // Construct the pre-filled Google Form URL.
            var href = OKCPAT.getSuggestionFormUrl() + '?';
            href += 'entry.1272351999=' + encodeURIComponent(q[i].getAttribute('id').split('_')[1]);
            href += '&entry.734244=' + encodeURIComponent(q[i].querySelector('.qtext').textContent);
            var possible_answers = '';
            var concerning_answers = '';
            var els = q[i].querySelectorAll('.self_answers li');
            for (var x = 0; x < els.length; x++) {
                possible_answers += els[x].textContent;
                // Add a newline unless this is the last possible answer.
                if (x !== (els.length - 1)) {
                    possible_answers += "\n";
                }
            }
            els = q[i].querySelectorAll('.self_answers li:not(.match)');
            for (x = 0; x < els.length; x++) {
                concerning_answers += els[x].textContent;
                if (x !== (els.length - 1)) {
                    concerning_answers += "\n";
                }
            }
            href += '&entry.1550986692=' + encodeURIComponent(possible_answers);
            href += '&entry.2047128191=' + encodeURIComponent(concerning_answers);
            var p = document.createElement('p');
            p.setAttribute('class', 'btn small');
            p.setAttribute('style', 'width: auto; max-width: 25em'); // Inline to override "!important" in CSS.
            var a = document.createElement('a');
            a.setAttribute('href', href);
            a.setAttribute('target', '_blank');
            a.innerHTML = 'Suggest as "red flag" to PAT-OKC';
            p.appendChild(a);
            q[i].appendChild(p);
        }
    }
};

OKCPAT.findUsersOnPage = function () {
    var user_els = document.querySelectorAll('a[href^="/profile/"]');
    var mysn = OKCPAT.getMyScreenname();
    // Make a list of their screennames,
    var names = [];
    for (var i = 0; i < user_els.length; i++) {
        var m = user_els[i].getAttribute('href').match(/\/profile\/([^?\/]+)/);
        // but don't duplicate names, and exclude our own screenname.
        if (m[1] && (-1 === names.indexOf(m[1])) && (m[1] !== mysn)) {
            names.push(m[1]);
        }
    }
    return names;
};

OKCPAT.flagUser = function (name) {
    // Find links to this user's profile,
    var link_els = document.querySelectorAll('a[href^="/profile/' + name + '"]');
    for (var i = 0; i < link_els.length; i++) {
        // and highlight them with a CSS class.
        link_els[i].setAttribute('class', link_els[i].className + ' okcpat_red_flagged');
    }
};

OKCPAT.doFirstRun = function () {
};

// The following is required for Chrome compatibility, as we need "text/html" parsing.
/*
 * DOMParser HTML extension
 * 2012-09-04
 *
 * By Eli Grey, http://eligrey.com
 * Public domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*! @source https://gist.github.com/1129031 */
/*global document, DOMParser*/

(function(DOMParser) {
	"use strict";

	var
	  DOMParser_proto = DOMParser.prototype
	, real_parseFromString = DOMParser_proto.parseFromString
	;

	// Firefox/Opera/IE throw errors on unsupported types
	try {
		// WebKit returns null on unsupported types
		if ((new DOMParser).parseFromString("", "text/html")) {
			// text/html parsing is natively supported
			return;
		}
	} catch (ex) {}

	DOMParser_proto.parseFromString = function(markup, type) {
		if (/^\s*text\/html\s*(?:;|$)/i.test(type)) {
			var
			  doc = document.implementation.createHTMLDocument("")
			;

			doc.body.innerHTML = markup;
			return doc;
		} else {
			return real_parseFromString.apply(this, arguments);
		}
	};
}(DOMParser));
