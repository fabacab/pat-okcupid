/**
 * Predator Alert Tool for OkCupid
 *
 * Written in 2013.
 *
 * To the extent possible under law, the author(s) have dedicated all copyright
 * and related and neighboring rights to this software to the public domain
 * worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along
 * with this software. If not, see
 *     http://creativecommons.org/publicdomain/zero/1.0/
 */

package okcupid_pat;

import java.lang.reflect.Field;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.annotation.Embed;
import com.googlecode.objectify.annotation.Id;
import static okcupid_pat.OfyService.ofy;

/**
 * Every OkCupidUser will have answered any number of questions. These answers
 * are modeled as an OkCupidAnswer, which is embedded in the OkCupidUser object.
 * See:
 *      https://code.google.com/p/objectify-appengine/wiki/Entities#Embedding
 */
@Embed
public class OkCupidAnswer {
    @Id private Long qid;
    private String qtext;
    private String answer;
    // We use transient here to avoid serialization to JSON via Gson,
    // but Objectify will still persist this in the GAE datastore.
    private transient Key<OkCupidUser> respondent; // Many-to-many relationship.

    // A no-argument constructor is required for Objectify.
    // Without it, the other constructors don't function.
    // See:
    //      https://code.google.com/p/objectify-appengine/wiki/Entities#The_Basics
    private OkCupidAnswer () {}

    // Getters.
    public Long getQuestionId () {
        return this.qid;
    }
    public String getQuestionText () {
        return this.qtext;
    }
    public String getAnswer () {
        return this.answer.trim();
    }
    public Key<OkCupidUser> getRespondent () {
        return this.respondent;
    }

    // And setters.
    public void setQuestionId (Long qid) {
        this.qid = qid;
    }
    public void setQuestionText (String qtext) {
        this.qtext = qtext;
    }
    public void setAnswer (String answer) {
        this.answer = answer;
    }
    public void setRespondent (OkCupidUser okc_user) {
        this.respondent = okc_user.getKey();
    }

    // Intended for debug or info logging only.
    // See: http://www.javapractices.com/topic/TopicAction.do?Id=55
    public String toString () {
        StringBuilder str = new StringBuilder();
        String NEW_LINE = System.getProperty("line.separator");

        str.append(this.getClass().getName() + " object {" + NEW_LINE);
        Field[] fields = this.getClass().getDeclaredFields();
        for (Field field : fields) {
            str.append("  ");
            try {
                str.append(field.getName());
                str.append(": " + field.getType().getSimpleName() + " ");
                str.append(field.get(this));
            }
            catch (IllegalAccessException ex) {
                System.out.println(ex);
            }
            str.append(NEW_LINE);
        }
        str.append("}");

        return str.toString();
    }
}
