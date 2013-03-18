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
        // These are additional concerning questions regarding sexual consent.
        21527 : 'Yes', // Do you feel there are any circumstances in which a person is obligated to have sex with you?
        19162 : [ // No means NO!
            "Mostly, occasionally it's really a Yes in disguise",
            "A No is just a Yes that needs a little convincing!",
            "Never, they all want me. They just don't know it."
        ],
        8218 : [ // Would you ever film a sexual encounter without your partner knowing?
            "Yes",
            "I'm Not Sure"
        ],
        // These are additional concerning questions which could eventually be
        // moved to their own sets once that feature is implemented.
        55349 : 'Yes.', // Have you ever thrown an object in anger during an argument?
        36624 : [ // Are you ever violent with your friends?
            'Yes, I use physical force whenever I want.',
            'Yes, but only playfully or in jest.'
        ],
        48947 : 'Yes.' // Is intoxication ever an acceptable excuse for acting stupid?
    },
//    // TODO: Support multiple lists of questions?
//    'flagged_qs_violence': {
//        55349 : 'Yes.',
//        // TODO: Support checking against MULTIPLE concerning answers.
//        36624 : ['Yes, I use physical force whenever I want.', 'Yes, but only playfully or in jest.'],
//        61281 : ['Always.', 'Frequently.']
//    },
//    'flagged_qs_polyamory': {
//        784 : 'No',
//        31581 : 'No way.'
//    },
    'flagged_qs_development': {
        784 : 'No',
        31581 : 'No way.',
        36624 : ['Yes, I use physical force whenever I want.', 'Yes, but only playfully or in jest.'],
        61281 : ['Always.', 'Frequently.']
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
#okcpat-first_run p { margin: 1em 0; }\
#okcpat-first_run ul {\
    margin: 0 2em;\
    list-style-type: disc;\
}\
');
OKCPAT.init = function () {
    if (OKCPAT.isFirstRun()) {
        OKCPAT.doFirstRun(OKCPAT.getFirstRunStep());
    }
    // TODO: Define a UI for choosing topic lists?
//    OKCPAT.CONFIG.active_topics.push('sexual_consent');
//    OKCPAT.CONFIG.active_topics.push('polyamory');
    OKCPAT.main();
};
window.addEventListener('DOMContentLoaded', OKCPAT.init);

OKCPAT.isFirstRun = function () {
    return (OKCPAT.getValue('completed_first_run_questionnaire')) ? false : true;
};
OKCPAT.getFirstRunStep = function () {
    var m = window.location.search.match(/pat_okc_first_run_step=(\d+)/);
    if (m && m[1]) {
        return parseInt(m[1]);
    } else {
        return 0;
    }
};
OKCPAT.getQuestionIdOfFirstRunStep = function (step) {
    var step = step || OKCPAT.getFirstRunStep();
    var k = Object.keys(OKCPAT.getFlaggedQs()).reverse(); // Newer questions first.
    return k[step];
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
        var qtext  = els[i].querySelector('#qtext_' + qid).childNodes[0].textContent.trim();
        var answer = els[i].querySelector('#answer_target_' + qid).childNodes[0].textContent.trim();
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
            if (json && (response.status === 200)) {
                // add a timestamp of when we last fetched this user's info.
                json.last_fetched = new Date().getTime();
                OKCPAT.saveLocally(json.screenname, json);
            }
        }
    });
};

OKCPAT.isConcerningAnswer = function (answer, flagged_answers) {
    OKCPAT.log('Checking answer "' + answer + '" against flagged answers: ' + flagged_answers.toString());
    if (
        'string' === typeof(flagged_answers)
        &&
        answer === flagged_answers
        ) { return true; }
    for (var i = 0; i < flagged_answers.length; i++) {
        if (answer=== flagged_answers[i]) {
            return true;
        }
    }
    return false;
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
                    if (OKCPAT.isConcerningAnswer(data.answers[x].answer.trim(), OKCPAT.getFlaggedQs()[k[y]])) {
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
    var m = window.location.pathname.match(/^\/profile\/([^\/]+)/);
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
        var before = document.getElementById('essay_0') // the "About" essay
            || document.querySelector('.question') // the first Match Question
            || document.querySelector('.description') // the first Photo Album
            || document.getElementById('main_column').childNodes[0]; // whatever else
        before.parentNode.insertBefore(div, before);
    }
    // If there are any questions the human user can see, offer a
    var q = document.querySelectorAll('.question');
    if (q.length) {
        OKCPAT.makeMatchQuestionsPermalinks();
        // link to suggest adding this question to the list of red flags.
        for (var i = 0; i < q.length; i++) {
            // but only if we're not doing the "first run" questionnaire.
            var total_steps = Object.keys(OKCPAT.getFlaggedQs()).length;
            var m = window.location.search.match(/pat_okc_first_run_step=(\d+)/);
            if (!m || (m[1] > total_steps)) {
                OKCPAT.injectRedFlagSuggestionButton(q[i]);
            }
        }
    }
};

OKCPAT.injectRedFlagSuggestionButton = function (q_el) {
    // Construct the pre-filled Google Form URL.
    var href = OKCPAT.getSuggestionFormUrl() + '?';
    href += 'entry.1272351999=' + encodeURIComponent(q_el.getAttribute('id').split('_')[1]);
    href += '&entry.734244=' + encodeURIComponent(q_el.querySelector('.qtext').textContent);
    var possible_answers = '';
    var concerning_answers = '';
    var els = q_el.querySelectorAll('.self_answers li');
    for (var x = 0; x < els.length; x++) {
        possible_answers += els[x].textContent;
        // Add a newline unless this is the last possible answer.
        if (x !== (els.length - 1)) {
            possible_answers += "\n";
        }
    }
    els = q_el.querySelectorAll('.self_answers li:not(.match)');
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
    q_el.appendChild(p);
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

// Dispatcher for the "first run" sequence.
OKCPAT.doFirstRun = function (step) {
    var step = step || 0;
    var total_steps = Object.keys(OKCPAT.getFlaggedQs()).length;
    OKCPAT.log('First run! Step: ' + step.toString());
    if (0 === step) {
        OKCPAT.startFirstRun();
    } else if (step <= total_steps) {
        var next_step = step + 1;
        var cur_qid   = OKCPAT.getQuestionIdOfFirstRunStep(step - 1); // Decrement for "this step".
        var next_qid  = OKCPAT.getQuestionIdOfFirstRunStep(step);
        var url = window.location.protocol
                + '//' + window.location.host
                + '/questions?rqid=' + encodeURIComponent(next_qid)
                + '&pat_okc_first_run_step=' + encodeURIComponent(next_step);
        var progress_txt = " You're on question <strong>" + step.toString() + " out of " + total_steps.toString() + "</strong> of PAT-OKC's required questionnaire.";

        // Remove the "Skip" button, if it's there.
        var skp = document.querySelector('.skip_btn');
        if (skp) {
            skp.parentNode.removeChild(skp);
        }

        // Hide the "answer privately" option, if it's there.
        var prv = document.querySelector('#new_question .answer_privately');
        if (prv) {
            prv.setAttribute('style', 'display: none;');
        }

        // Hijack the "Submit" button, if it's there.
        var sbtn = document.getElementById('submit_btn_' + cur_qid.toString());
        if (sbtn) { // this is actually a <p> element in OkCupid's code.
            // Replace their JS. For some reason, this won't work with event handlers. :(
            sbtn.firstElementChild.setAttribute('onclick',
                'BigDig.submitAnswer(' + cur_qid.toString() + '); '
                + 'setTimeout(function() {' + // Set a timer to redirect.
                    'window.location = \'' + url + '\'' // to the next step
                + '}, 2000);' // in 2 seconds.
                + 'return false;'
            );
        }

        // If there's a next "red flag" question,
        if (next_qid) {
            // Hijack the "Next question" button, if it's there.
            var xpath = document.evaluate(
                '//*[contains(@class, "notice")]//a[text()="Next question"]',
                document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
            );
            var nxt = (xpath.singleNodeValue) ? xpath.singleNodeValue : false;
            if (nxt) {
                nxt.removeAttribute('onclick'); // Erase their JS
                // Force the button to link to the next action in our sequence.
                nxt.setAttribute('href',
                    '/questions?rqid=' + encodeURIComponent(next_qid)
                    + '&pat_okc_first_run_step=' + encodeURIComponent(next_step.toString())
                );
            }
        } else {
            // otherwise, make sure there's no "Next question" button at all.
            var nbtn = document.querySelector('.notice > p.btn');
            if (nbtn) { nbtn.parentNode.removeChild(nbtn); }
        }

        // Customize the "Notice" text.
        // TODO: Clean this up when we hit the "staff robot" (at 25 questions or so).
        var el = document.querySelector('.notice') || document.getElementById('guide_text');
        var nx = el.getAttribute('class').match(/green|pink|sr_message/);
        if (!nx) {
            // Neither "green" or "pink" (or the "staff robot") means we've answered but can re-answer.
            var txt = 'Looks like you already answered this important PAT-OKC question! Rock on, rockstar!';
            el.querySelector('p:not(.btn)').setAttribute('style', 'margin-right: 140px;');
        } else {
            switch (nx[0]) {
                case 'green':
                case 'sr_message':
                    var txt = "Yay! You're making the Internet safer with every question you answer!";
                    break;
                case 'pink':
                    var txt = 'Woah there, you recently answered this question already!';
                    el.querySelector('p:not(.btn)').setAttribute('style', 'margin-right: 140px;');
                    // If we can't re-answer AND this is the last question,
                    if (!next_qid) {
                        // offer a "congrats, you're done!" link.
                        txt += '<p class="btn small green" style="width: 160px;"><a href="' + url + '">Start using PAT-OKC!</a></p>';
                    }
                    break;
            }
        }
        el.querySelector('p:not(.btn)').innerHTML = txt + '<br /><br />' + progress_txt;
    } else {
        OKCPAT.finishFirstRun();
    }
};

OKCPAT.startFirstRun = function () {
    // Inject a pop-up.
    var div = document.createElement('div');
    div.setAttribute('id', 'okcpat-first_run');
    div.setAttribute('class', 'flag_pop text_attached shadowbox');
    div.setAttribute('style', 'display: block; width: 700px; position: absolute; left: 30px');
    var html = '<div class="container">';
    html += '<h1>Thank you for installing the <a href="https://github.com/meitar/pat-okc/#readme">Predator Alert Tool for OkCupid</a>!</h1>';
    html += '<p>The Predator Alert Tool for OkCupid (PAT-OKC) is <strong>an early-warning system</strong> that highlights red flags which may be an indicator of predatory or abusive behavior.</p>';
    html += '<p>However, it <strong>is no substitute for basic <a href="http://maymay.net/blog/2013/02/20/howto-use-tor-for-all-network-traffic-by-default-on-mac-os-x/#step-6">Internet self-defense</a></strong>. PAT-OKC can only give you information to help you make better decisions; the decisions you make are still up to you. Always meet people you don\'t know from OkCupid in a public place, and consider <a href="https://yesmeansyesblog.wordpress.com/2010/04/26/what-is-a-safecall/">setting up a safe call</a> with one of your friends.</p>';
    html += "<p>As this is the first time you've installed the Predator Alert Tool for OkCupid (PAT-OKC), <strong>you'll be asked to answer a few OkCupid Match Questions</strong> that will help ensure your Web browser has the information it needs to alert you of a potentially dangerous profile. Ready? Set?</p>";
    var next_qid = OKCPAT.getQuestionIdOfFirstRunStep(0); // This is always the first step.
    html += '<div class="buttons"><p class="btn small flag_button green"><a href="/questions?rqid=' + next_qid + '&pat_okc_first_run_step=1">Go!</a></p></div>';
    html += '</div>';
    div.innerHTML = html;
    var el = document.querySelector('.tabbed_heading');
    // If we're not a profile page, then get other elements out of the way.
    if (!window.location.pathname.match(/^\/profile/)) {
        GM_addStyle('\
            #matches_block { z-index: 1; }\
            .fullness, p.fullness-bar, p.fullness-bar span.progress { display: none; }\
        ');
        // OkC uses inline style, so alter it directly.
        if (grr = document.querySelector('.page_tabs li[style]')) { grr.setAttribute('style', ''); }
        el.setAttribute('style', 'z-index: 1000;' + el.getAttribute('style'));
        div.style.top = '30px';
    }
    el.insertBefore(div, el.firstChild);
};
OKCPAT.finishFirstRun = function () {
    // Record that we've completed the first run sequence.
    OKCPAT.setValue('completed_first_run_questionnaire', true);
    // Inject a pop-up.
    var div = document.createElement('div');
    div.setAttribute('id', 'okcpat-first_run');
    div.setAttribute('class', 'flag_pop text_attached shadowbox');
    div.setAttribute('style', 'display: block; width: 700px; position: absolute; left: 30px');
    var html = '<div class="container">';
    html += '<h1>You finished the <a href="https://github.com/meitar/pat-okc/#readme">Predator Alert Tool for OkCupid</a> questionnaire!</h1>';
    html += '<p>You are now ready to begin using The Predator Alert Tool for OkCupid. :) Basically, that just means continuing to use OkCupid as you have been. However, there will be a few small changes:</p>';
    html += '<ul><li><img src="http://ak2.okccdn.com/php/load_okc_image.php/images/160x160/160x160/813x237/1500x924/2/7542193099865135582.jpeg" width="40" class="okcpat_red_flagged" style="float: right; margin: 0 0 1em 1em" />If you come across the OkCupid Profile of someone who PAT-OKC thinks might be dangerous, all of their pictures and links to their profile pages will be outlined in <strong>a blocky red square</strong>, as shown. If you see such a square (in a real situation, that is, other than this example), click in it for an explanation of why that profile was flagged.</li>';
    html += '<li>If you come across a Match Question that you think should be considered a "red flag", click the button to suggest it be added. The button looks like this: <p class="btn small" style="float: none; display: inline-block; margin: 0; width: auto;"><a href="#">Suggest as \'red flag\' to PAT-OKC</a></p></li></ul>';
    html += '<p>And most important of all, please tell your friends about the Predator Alert Tool for OkCupid! If we work together to share information, we can all keep one another safer! To learn more about the origins of this tool and what can be done to combat rape culture from a technological perspective, read the developer\'s blog: <a href="http://maybemaimed.com/2012/12/21/tracking-rape-cultures-social-license-to-operate-online/">Tracking rape culture\'s social license to operate online</a>.</p>';
    html += '<div class="buttons"><p class="btn small flag_button green" style="width: auto;"><a style="padding: 0 20px;" href="#" onclick="var x = document.getElementById(\'okcpat-first_run\'); x.parentNode.removeChild(x); return false;">Thanks! I feel better already!</a></p></div>';
    html += '</div>';
    div.innerHTML = html;
    var el = document.querySelector('.tabbed_heading');
    // If we're not a profile page, then get other elements out of the way.
    if (!window.location.pathname.match(/^\/profile/)) {
        GM_addStyle('\
            #matches_block { z-index: 1; }\
            .fullness, p.fullness-bar, p.fullness-bar span.progress { display: none; }\
        ');
        // OkC uses inline style, so alter it directly.
        if (grr = document.querySelector('.page_tabs li[style]')) { grr.setAttribute('style', ''); }
        el.setAttribute('style', 'z-index: 1000;' + el.getAttribute('style'));
        div.style.top = '30px';
    }
    el.insertBefore(div, el.firstChild);
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
