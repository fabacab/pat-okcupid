/**
 *
 * This is a Greasemonkey script and must be run using a Greasemonkey-compatible browser.
 *
 * @author maymay <bitetheappleback@gmail.com>
 */
// ==UserScript==
// @name           OkCupid Self-Reported Sexual Predator Alert Tool
// @version        0.1
// @namespace      com.maybemaimed.okcupid.pat
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
    'storage_server_url': '', // Our centralized database.
    'storage_server_url_development': 'http://localhost:8080/okcupid_pat', // A dev server, for when 'debug' is true.
};

// Utility debugging function.
OKCPAT.log = function (msg) {
    if (!OKCPAT.CONFIG.debug) { return; }
    GM_log('OKCUPID SRSPAT: ' + msg);
};

// Initializations.
// Don't run in frames.
if (window.top !== window.self) {
    OKCPAT.log('In frame on page ' + window.location.href + ' (Aborting.)');
    return;
}
var uw = unsafeWindow || window; // Help with Chrome compatibility?
GM_addStyle('\
');
OKCPAT.init = function () {
    OKCPAT.main();
};
window.addEventListener('DOMContentLoaded', OKCPAT.init);

OKCPAT.getServerUrl = function (path) {
    path = path || '';
    return (OKCPAT.CONFIG.debug) ?
        OKCPAT.CONFIG.storage_server_url_development + path:
        OKCPAT.CONFIG.storage_server_url + path;
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

// This expects JSON-formatted data.
// TODO: Add some error-handling to these functions?
OKCPAT.saveLocally = function (key, data) {
    return OKCPAT.setValue(key, JSON.stringify(data));
};
OKCPAT.readLocally = function (key) {
    return JSON.parse(OKCPAT.getValue(key));
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
            var answered_questions = doc.querySelectorAll('.question:not(.not_answered)');
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
                OKCPAT.saveLocally(userid, json);
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
    // If we're on a different user's profile page,
    if (window.location.pathname.match(/^profile\//)) { // An intermediate slash means a target user is present.
        // Grab the target IDs here.
        var targetid = OKCPAT.getTargetUserId();
        var targetsn = OKCPAT.getTargetScreenname();
        // Read the list of questions answered by this user, if we remember any.
        var data = OKCPAT.readLocally(targetid);
        // If that person has answered one of a set of Match Questions from Lisak and Miller,
        // TODO: How are we going to figure out which are the appropriate set of questions?
        // Report their answers to the centralized server
        // TODO: Figure out how best to send this information to the back-end
    }
    // Find all links to OkCupid Users on this page.
    var user_els = document.querySelectorAll('a[href^="/profile/"]');
    // Make a list of their screennames,
    var names = [];
    for (var i = 0; i < user_els.length; i++) {
        var m = user_els[i].getAttribute('href').match(/\/profile\/([^?\/]+)/);
        // but don't duplicate names, and exclude our own screenname.
        if (m[1] && (-1 === names.indexOf(m[1])) && (m[1] !== mysn)) {
            names.push(m[1]);
        }
    }
    // Begin scraping the target OkCupid Users found.
    // TODO: Should we also find and scrape OkCupid Users from returned pages?
    for (var i = 0; i < names.length; i++) {
        OKCPAT.log('Beginning scraping Match Questions answered by ' + names[i]);
        OKCPAT.scrapeMatchQuestionsPage(names[i]);
    }
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
