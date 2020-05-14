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
