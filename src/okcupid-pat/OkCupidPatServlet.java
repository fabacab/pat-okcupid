package okcupid_pat;

import java.io.IOException;
import java.util.logging.Logger;
import javax.servlet.http.*;
import com.google.gson.Gson;

public class OkCupidPatServlet extends HttpServlet {
    private static final Logger log = Logger.getLogger(OkCupidPatServlet.class.getName());

    public void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        log.info("Handling GET request from " + req.getRemoteAddr());
        resp.setContentType("text/plain");
        // TODO:
        // When this Servlet receives a GET, look for the "userid" parameter.
        // Retrieve the associated OkCupidUser objects form the datastore.
        // Send back JSON data for that user and their answered questions.
        Gson gson = new Gson();
        OkCupidUser okcusr = new OkCupidUser("1", "testuser");
        String json = gson.toJson(okcusr);
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
        Gson gson = new Gson();
        OkCupidUser okcusr = gson.fromJson(line, OkCupidUser.class);
        log.info("Converted JSON to POJO: " + okcusr.toString());
        // TODO:
        // Check the userid to see if we've saved one already in our datastore.
        // Create a new OkCupidUser if we don't have with this userid.
        // Add the answered questions to the set of OkCupidUser.answers.
        // Save the OkCupidUser in the datastore.
    }
}
