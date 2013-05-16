/**
 * Predator Alert Tool for OkCupid
 *
 * Written in 2013 by Meitar Moscovitz <meitar@maymay.net>
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
import java.util.Set;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Embed;
import static okcupid_pat.OfyService.ofy;

/**
 * An OkCupid User will have any number of OkCupid Questions they answered
 * associated with them.
 */
@Entity
public class OkCupidUser {
    @Id    private String userid;
    @Index private String screenname;
    private Set<OkCupidAnswer> answers;

    // A no-argument constructor is required for Objectify.
    // Without it, the other constructors don't function.
    // See:
    //      https://code.google.com/p/objectify-appengine/wiki/Entities#The_Basics
    private OkCupidUser () {}

    // Getters.
    public String getUserId () {
        return this.userid;
    }
    public String getScreenname () {
        return this.screenname;
    }
    public Set<OkCupidAnswer> getAnswers () {
        return this.answers;
    }
    public Key<OkCupidUser> getKey () {
        return Key.create(OkCupidUser.class, this.userid);
    }

    // And setters.
    public void setUserId (String uid) {
        this.userid = uid;
    }
    public void setScreenname (String sn) {
        this.screenname = sn;
    }

    // Adds an OkCupid Match Question to the set of Set<OkCupidAnswer>'s here.
    public void addOkCupidAnswer (OkCupidAnswer ans) {
        // Have we already answered a question with this ID?
        for (OkCupidAnswer x : this.answers) {
            if (ans.getQuestionId().equals(x.getQuestionId())) {
                return; // Yup, so do nothing.
            }
        }
        // We didn't find a stored answer with this Question ID, so add it.
        this.answers.add(ans);
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
