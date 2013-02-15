package okcupid_pat;

import java.io.IOException;
import java.util.List;
import java.util.logging.Logger;
import javax.servlet.http.*;
import com.google.gson.Gson;
import static okcupid_pat.OfyService.ofy;

public class OkCupidPatServlet extends HttpServlet {
    private static final Logger log = Logger.getLogger(OkCupidPatServlet.class.getName());
    private Gson gson = new Gson();

    public void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        log.info("Handling GET request for " + req.getPathInfo() + " from " + req.getRemoteAddr());

        // If there wasn't any path information,
        if (null == req.getPathInfo()) {
            // Redirect to a basic GET listing request.
            System.out.println(req.getServletPath());
            resp.sendRedirect(req.getServletPath() + "/");
            return;
        }

        // Set up HTTP headers.
        resp.setContentType("application/json");

        // Parse out RESTful parameters for this request.
        String[] path_pieces = req.getPathInfo().split("/");
        if (path_pieces.length < 1) {
            // If no parameters, send back a list of all OkCupidUser objects.
            List<OkCupidUser> x = ofy().load().type(OkCupidUser.class).list();
            String json = gson.toJson(x);
            resp.getWriter().println(json);
            return;
        }
        // The first parameter is the JSON-supplied "userid".
        String userid = path_pieces[1];

        // Retrieve the associated OkCupidUser object from the datastore.
        OkCupidUser okcusr = ofy().load().type(OkCupidUser.class).id(userid).get();

        // Translate from a POJO to JSON using Gson.
        String json = gson.toJson(okcusr);

        // Send back JSON data for that user and their answered questions.
        resp.getWriter().println(json);
    }

    public void doPost (HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        log.info("Handling POST request from " + req.getRemoteAddr());

        // Read body of POST'ed request.
        String line;
        if ( (line = req.getReader().readLine()) != null ) {
            log.info("Received JSON data: " + line);
        }

        // Parse out the JSON'ed data to our OkCupidUser data model.
        OkCupidUser okcusr = gson.fromJson(line, OkCupidUser.class);

        for (OkCupidAnswer answer : okcusr.getAnswers()) {
            answer.setRespondent(okcusr);
        }

        // Check to see if we've saved this user in our datastore already.
        OkCupidUser persistent_user = ofy().load().key(okcusr.getKey()).get();
        if (null == persistent_user) {
            // If we got `null`, then we don't remember this User ID, so let's
            // save a new entity just as we received it from the JSON message.
            ofy().save().entity(okcusr).now();
        } else {
            // Else, we need to load the OkCupidUser from the datastore and
            // append the JSON data we received to the POJO before saving it.
            for (OkCupidAnswer answer : okcusr.getAnswers()) {
                persistent_user.addOkCupidAnswer(answer);
            }
            ofy().save().entity(persistent_user).now();
        }

        StringBuilder reply_url = new StringBuilder();
        reply_url.append("http://");
        reply_url.append(req.getHeader("Host"));
        reply_url.append(req.getServletPath() + "/");
        reply_url.append(okcusr.getUserId());
        JsonHttpResponse output = new JsonHttpResponse("200 OK", reply_url.toString());
        String json = gson.toJson(output);

        // Set up HTTP headers.
        resp.setContentType("application/json");
        log.info("Responding with JSON reply: " + System.getProperty("line.separator") + json);
        resp.getWriter().println(json);
    }
}

// RESTful JSON response class, for passing to Gson.
// This tries to comform to the XMLHttpRequest standard.
// See: https://developer.mozilla.org/en-US/docs/DOM/XMLHttpRequest#Properties
class JsonHttpResponse {
    private int status;
    private String statusText;
    private String url;

    public JsonHttpResponse (String statusText, String url) {
        this.status = Integer.parseInt(statusText.split(" ")[0]);
        this.statusText = statusText;
        this.url = url;
    }
}
