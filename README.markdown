# Predator Alert Tool for OkCupid

The Predator Alert Tool for OkCupid (PAT-OKC) is an add-on to your Web browser that alerts of you of any red flags for a given profile as you browse [OkCupid](https://en.wikipedia.org/wiki/OkCupid). A "red flag" is simply a public action taken by the given profile that is concerning, such as answering Match Questions in the same way an undetected rapist is statistically likely to answer them. For instance, given the following question, an answer of "Yes." would be alarming:

> Have you ever been in a situation where you tried, but for various reasons did not succeed, in having sexual intercourse with an adult by using or threatening to use physical force (twisting their arm, holding them down, etc.) if they did not cooperate?

This is not a hypothetical question, nor is the answer universally obvious. This is, in fact, the exact phrasing of a question used in a study called "Repeat Rape and Multiple Offending Among Undetected Rapists" by David Lisak and Paul M. Miller, published in Violence and Victims, Vol 17, No. 1, 2002 (Lisak and Miller 2002).

Tragically, *a statistically significant portion of respondents answered in the affirmative.* This finding was essentially duplicated in a similar study called ["Reports of Rape Reperpetration by Newly Enlisted Male Navy Personnel" by Stephanie K. McWhorter, et. al., published in Violence and Victims, Volume 24, No. 2, 2009 (McWhorter 2009)](http://ncherm.org/documents/McWhorterVV2009.pdf). While much smaller than the portion of respondents who answered with a "no," the fact that some people blithely answered "yes" makes these questions worth asking up-front, to everyone, all the time.

The Predator Alert Tool for OkCupid automates this process and issues warnings if its heuristics find a concerning match. This early warning system can help OkCupid users make better informed choices about what measures they feel they need to take to remain safe while using the service.

Additionally:

* While browsing OkCupid, the Predator Alert Tool will visually highlight any user profile you encounter that has answered these questions in a concerning way. Click through to the user's profile for a complete listing of concerning Match Question answers.
* Each time you load a user's OkCupid profile, that user's profile picture is scanned against the United States's Sex Offender Registry using the facial recognition service provided by CreepShield.com, and the an "RSO facial match" percentage is shown to you.

![Screenshot of OkCupid profile with "RSO facial match" percentage added.](https://i.imgur.com/qCmwMly.png)

Click on the RSO facial match percentage to a get more information in an OkCupid pop-up.

![Screenshot of Predator Alert Tool for OkCupid displaying CreepShield results after clicking on "RSO facial match" percentage on a user's OkCupid profile.](https://i.imgur.com/aoiCZKk.png)

Click the "Search" button in the pop up to get the full search results from CreepShield.com.

## System requirements

The following software must be installed on your system before installing the Predator Alert Tool for OkCupid user script.

### Mozilla Firefox

If you use the [Mozilla Firefox](http://getfirefox.com/) web browser (version 12.0 or higher), ensure you have the [Greasemonkey extension](https://addons.mozilla.org/en-US/firefox/addon/greasemonkey/) installed (at version 1.0 or higher).

### Google Chrome

If you use the [Google Chrome](https://chrome.google.com/) web browser (version 23 or higher), ensure you have the [Tampermonkey extension](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) installed.

## Installing

To install the Predator Alert Tool for OkCupid, go to [http://maybemaimed.com/playground/predator-alert-tool-for-okcupid/](http://maybemaimed.com/playground/predator-alert-tool-for-okcupid/) and click "[Download and install](https://userscripts.org/scripts/source/163064.user.js)" near the middle of the page:

> [Download and install Predator Alert Tool for OkCupid](https://userscripts.org/scripts/source/163064.user.js)

There's also a fantastic, thorough [installation walkthrough (with screenshots!) you can follow](https://unquietpirate.wordpress.com/2013/04/04/how-to-install-the-predator-alert-tool-for-okcupid/).

If you enjoy this script, please consider tossing a few metaphorical coins in [my cyberbusking hat](http://maybemaimed.com/cyberbusking/). :) Your donations are sincerely appreciated! Can't afford to part with any coin? It's cool. [Tweet your appreciation, instead](https://twitter.com/intent/tweet?text=Early+warning+of+tornados%3F+Check.+Want+an+early+warning+system+for+%23rape+%23culture%3F+http%3A%2F%2Fmaybemaimed.com%2Fplayground%2Fpredator-alert-tool-for-okcupid%2F+Predator+Alert+%23Tool+for+%40OkCupid.).

If [maybemaimed.com is censored](http://maybemaimed.com/where-im-censored/) where you are, you can alternatively go to [the Userscripts.org page for Predator Alert Tool for OkCupid](https://userscripts.org/scripts/show/163064) and click on "[Install](http://userscripts.org/scripts/source/163064.user.js)". If the tool is also unavailable there, you can alternatively [download PAT-OKC from GitHub.com](https://github.com/meitar/pat-okcupid/raw/master/okcupid-predator-alert-tool.user.js).

## Using

After installing the Predator Alert Tool for OkCupid (PAT-OKC), you will be presented with a welcome screen that describes the tool's use, its limitations, and provides links to helpful safety information.

![Screenshot of PAT-OKC welcome screen.](http://i.imgur.com/VlgRNj3.png)

Click on the "Go" button and you'll begin the installation questionnaire, modeled after the survey in Lisak and Miller's study, cited above. It'll look like this:

![Screenshot of PAT-OKC questionnaire.](http://i.imgur.com/rzuz7kj.png)

Complete the Match Questions in the PAT-OKC questionnaire just as you would an ordinary OkCupid question. When you submit your answer, you'll automatically be redirected to the next required question. You'll also be able to pause the questionnaire periodically and resume it later.

When you've completed all of the questions, you'll be presented with a pop-up box that offers a brief summary of how to use the Predator Alert Tool for OkCupid:

![Screenshot of PAT-OKC summary after completing its quesionnaire.](http://i.imgur.com/cbfoMvY.png)

If you encounter a profile on an OkCupid page whose behavior on the site is concerning, PAT-OKC will highlight links to that user's profile in a red, blocky outline. Viewing that user's OkCupid profile page will offer a full explanation of why that user's profile was red-flagged.

## Frequently Asked Questions

Before you report a new issue with the Predator Alert Tool for OkCupid (PAT-OKC), please check to ensure your question is not already addressed in the list below.

* [Can I suggest additional criteria as a "red flag"?](#can-i-suggest-additional-criteria-as-a-red-flag)
* [Why are profiles I've never visited showing up on my "You recently visited" list?](#why-are-profiles-ive-never-visited-showing-up-on-my-you-recently-visited-list)
* [Where can I learn more about this issue?](#where-can-i-learn-more-about-this-issue)

### Can I suggest additional criteria as a "red flag"?

Yes. If you come across an OkCupid Match Question that you think PAT-OKC should consider as a "red flag," click the "Suggest as 'red flag' to PAT-OKC" button, described above. You can also suggest Match Questions for consideration without having PAT-OKC installed by [filling in the suggestion form manually](https://docs.google.com/forms/d/15zyiFLP71Qtl6eVtACjg2SIaV9ZKAv3DpcK0d_9_Qnc/viewform). (The "Suggest" button simply pre-fills the suggestion form with as much data as it can find automatically.)

If you would like to suggest new Match Questions, first [create the Match Question on OkCupid](http://www.okcupid.com/questions/create), and *then* suggest it for consideration to PAT-OKC.

Version 0.4 of PAT-OKC also includes a "custom flag" feature. You can tell Predator Alert Tool for OkCupid to treat any question you encounter as a red flag by clicking the "Add to my red-flags" button next to the "Suggest as 'red flag'" button. The "Add to your custom set of red-flag warning questions" pop-up will appear, and you can indicate which answer(s) concerns you. Then click "Save." You can edit your custom flag at any time by clicking the "Edit this red-flag" button, which replaces the "Add to my red-flags" button.

### Why are profiles I've never visited showing up on my "You recently visited" list?

Part of the way PAT-OKC works is by "looking" at the public answers to Match Questions other users provided on their profiles. To do this, PAT-OKC needs to load those profiles. It does exactly what you do when you look at other people's answers; it loads their pages!

Since PAT-OKC loads their profile, OkCupid thinks you've "visited" their profile. This is normal and, unfortunately, unavoidable for as long as OkCupid doesn't provide an officially supported way to do what PAT-OKC does. (Feel free to contact them and let them know you want them to change this!)

In the mean time, however, this means other users may be getting notified that you've "visited" their profile. OkCupid does provide an option for you to browse anonymously. This means that even if you visit someone's profile, you won't show up in their "visitors" list, even though they will still show up in your "You recently visited" list.

You can [learn more about "browsing openly" on OkCupid's privacy help page](https://www.okcupid.com/help/privacy#browsing_openly).

### Where can I learn more about this issue?

The following articles are important reads that offer additional background and context for this issue:

* [No good excuse for not building sexual assault prevention tools into every social network on the Internet](http://maybemaimed.com/2013/10/09/no-good-excuse-for-not-building-sexual-violence-prevention-tools-into-every-social-network-on-the-internet/)
* [Tracking rape culture's social license to operate online](http://maybemaimed.com/2012/12/21/tracking-rape-cultures-social-license-to-operate-online/)
* [Help dating websites' Rape Culture FAADE Away](http://days.maybemaimed.com/post/39785638940/last-october-i-introduced-the-fetlife-alleged)
* [Rape culture, meet Internet culture: PAT-OKC and other online anti-rape initiatives](https://unquietpirate.wordpress.com/2013/03/30/rape-culture-meet-internet-culture-pat-okc-and-other-online-anti-rape-initiatives/)

Each of the pages listed above also contain numerous additional links. I'd recommend reading them, too.

## Change log

* Version 0.5.2:
    * Enhancement: Only open new tabs for CreepShield.com when required by the specific error message.
* Version 0.5.1:
    * Bugfix: CreepShield integration now works with Google Chrome as well as Mozilla Firefox.
    * Bugfix: RSO facial match pop-up can be viewed more than once without reloading the profile page.
    * Bugfix: `.webp` profile pictures returned by OkCupid are now translated to `.jpg`, which CreepShield expects, resulting in fewer "CreepShield Error" responses and more successful searches.
* Version 0.5:
    * Integration with CreepShield.com now offers automatic facial recognition scans of OkCupid user profile pictures against the United States national Sex Offender Registry.
* Version 0.4.3:
    * Update for OkCupid's new internal JavaScript, fixes [bug causing failure to display "OkCupid Predator Alert Warning" profile section](https://github.com/meitar/pat-okcupid/issues/17).
* Version 0.4.2:
    * Update for OkCupid's new interface includes:
        * Fixes for [visual interlacing](https://github.com/meitar/pat-okcupid/issues/16), incorrect questionnaire sequence, more.
        * Notify users of [Predator Alert Tool for Facebook](https://apps.facebook.com/predator-alert-tool/) availability.
* Version 0.4.1:
    * Fix bug where custom flag popup was sometimes visually obscured.
* Version 0.4:
    * [New feature: custom flag set](https://github.com/meitar/pat-okcupid/issues/9). You can now define your own set of warning questions and red-flagged answers.
    * Fixed bug where some possible answers to Match Questions were not being suggested in the PAT-OKC suggestion form.
* Version 0.3:
    * Add survey questions from [McWhorter's 2009 study](http://ncherm.org/documents/McWhorterVV2009.pdf) to flag questions set.
    * Fix bug where pausing the questionnaire before answering the first question resulted in unpredictable behavior.
    * Add simple version check mechanism.
* Version 0.2.4:
    * [Issue #3](https://github.com/meitar/pat-okcupid/issues/3#issuecomment-17585020): Improve performance. This may resolve some reported crashes, particulary on Firefox, too. (Thanks, [focalintent](https://twitter.com/focalintent)!)
    * [Fixed bug #1](https://github.com/meitar/pat-okcupid/issues/1): PAT-OKC now remembers your place in the questionnaire, even if you forget to "pause."
    * Fixed broken links in some pop-up messages.
* Version 0.2.3:
    * Fixed typo in user interface. :) What? I'm human, too.
* Version 0.2.2:
    * Improve local data handling so as not to rely only on a centralized server.
* Version 0.2.1:
    * First public release.
* Version 0.2:
    * Initial orientation path and installation quesionnaire.
* Version 0.1:
    * Initial working prototype.
