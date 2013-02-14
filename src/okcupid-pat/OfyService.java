package okcupid_pat;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyFactory;
import com.googlecode.objectify.ObjectifyService;

// Personalized copy of the ObjectifyService() used for initialization, etc.
// See https://code.google.com/p/objectify-appengine/wiki/BestPractices#Use_Your_Own_Service
public class OfyService {
    static {
        // Register data model classes.
        factory().register(OkCupidUser.class);
    }

    public static Objectify ofy () {
        return ObjectifyService.ofy();
    }

    public static ObjectifyFactory factory () {
        return ObjectifyService.factory();
    }
}
