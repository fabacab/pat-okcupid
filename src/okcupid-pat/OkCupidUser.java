package okcupid_pat;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Embed;
import java.util.Set;

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

    public OkCupidUser (String uid, String sn) {
        this.userid = uid;
        this.screenname = sn;
    }

    // Getters.
    public String getUserId () {
        return this.userid;
    }
    public String getScreenname () {
        return this.screenname;
    }

    // And setters.
    public void setUserId (String uid) {
        this.userid = uid;
    }
    public void setScreenname (String sn) {
        this.screenname = sn;
    }
}

/**
 * Every OkCupidUser will have answered any number of questions. These answers
 * are modeled as an OkCupidAnswer, which is embedded in the OkCupidUser object.
 * See:
 *      https://code.google.com/p/objectify-appengine/wiki/Entities#Embedding
 */
@Embed
class OkCupidAnswer {
    private String qid;      // The OkCupid Question ID this answer has answered.
    private String question; // The text of the question from OkCupid.
    private String answer;   // The text of the answer.
}
