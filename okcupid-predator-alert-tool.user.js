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
// @include        http://www.okcupid.com/profile/*
// @grant          GM_log
// @grant          GM_xmlhttpRequest
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// ==/UserScript==

OKCPAT = {};
OKCPAT.CONFIG = {
    'debug': false, // switch to true to debug.
    // TODO: Uh, make this. ;)
    'storage_server_url': '' // Our centralized database.
};

// Utility debugging function.
OKCPAT.log = function (msg) {
    if (!OKCPAT.CONFIG.debug) { return; }
    GM_log('OKCUPID SRSPAT: ' + msg);
};

// Initializations.
// Don't run in frames.
if (window.top != window.self) {
    OKCPAT.log('In frame: ' + location.href + ' (Aborting.)');
    return;
}

var uw = (unsafeWindow) ? unsafeWindow : window ; // Help with Chrome compatibility?
GM_addStyle('\
');
OKCPAT.init = function () {
    OKCPAT.main();
};
window.addEventListener('DOMContentLoaded', OKCPAT.init);

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

// NOTE: "target" = other user, "my" = logged-in user
OKCPAT.getMyUserId = function () {
    return uw.CURRENTUSERID;
};
OKCPAT.getMyScreenname = function () {
    return uw.SCREENNAME;
};
OKCPAT.getTargetUserId = function () {
    return uw.user_info.userid;
};
OKCPAT.getTargetScreenname = function () {
    return uw.user_info.screenname;
};
OKCPAT.isTargetMe = function () {
    return (this.getMyUserId() === this.getTargetUserId()) ? true : false;
};

// Fetch a page of Match Questions for a particular screenname
OKCPAT.getQuestionsPage = function (screenname, page_num) {
    var url = window.location.protocol + '//' + window.location.host + '/profile/'
        + screenname + '/questions';
    GM_xmlhttpRequest({
        'method': 'GET',
        'url': url,
        'onload': function (response) {
            // TODO: Process success, and then recurse?
            // Find only the answered questions, since those are what we can scrape.
            var parser = new DOMParser();
            var doc = parser.parseFromString(response.responseText, 'text/html');
            var answered_questions = doc.querySelectorAll('.question:not(.not_answered)');
            var processed_answers = OKCPAT.processAnsweredQuestions(answered_questions);
            // TODO: What are we gonna do with these processed answers?
            // TODO: recurse for next page?
        }
    });
};

OKCPAT.processAnsweredQuestions = function (els) {
    var arr_qs = [];
    // for each answered question on this page,
    for (var i = 0; i < els.length; i++) {
        var qid       = els[i].getAttribute('id').match(/\d+$/)[0];
        var qanswered = els[i].querySelector('#answer_target_' + qid).childNodes[0].textContent;
        // TODO: Ask the server if we've already got a match for question X with answer Y.
        // If we don't, send this information to the server for storage.
        arr_qs.push({'qid' : qid, 'qanswered' : qanswered});
    }
    return arr_qs;
};

// This is the main() function, executed on page load.
OKCPAT.main = function () {
    // Determine what profile we're looking at.
    var targetid = OKCPAT.getTargetUserId();
    var targetsn = OKCPAT.getTargetScreenname();
    var myid = OKCPAT.getMyUserId();
    var mysn = OKCPAT.getMyScreenname();
    // Begin paging through the active profile's Match Questions
    OKCPAT.getQuestionsPage(targetsn);
        // If that person has answered one of a set of Match Questions from Lisak and Miller,
        // TODO: How are we going to figure out which are the appropriate set of questions?
        // Report their answers to the centralized server
        // TODO: Figure out how best to send this information to the back-end

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
