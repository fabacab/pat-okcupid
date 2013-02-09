package okcupid_pat;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Embed;
import java.util.Set;
import java.lang.reflect.Field;

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

/**
 * Every OkCupidUser will have answered any number of questions. These answers
 * are modeled as an OkCupidAnswer, which is embedded in the OkCupidUser object.
 * See:
 *      https://code.google.com/p/objectify-appengine/wiki/Entities#Embedding
 */
@Embed
class OkCupidAnswer {
    private String qid;    // The OkCupid Question ID this answer has answered.
    private String qtext;  // The text of the question from OkCupid.
    private String answer; // The text of the answer.
}
