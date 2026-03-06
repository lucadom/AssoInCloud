package it.assoincloud.backend.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Serves the Next.js static export pages.
 *
 * Spring Boot's resource handler automatically serves index.html for "/" and
 * all _next/* assets. This controller handles the /login route, which maps to
 * the login.html file produced by "next build" with output: "export".
 */
@Controller
public class FrontendController {

    @GetMapping({"/login", "/login/"})
    public String login() {
        return "forward:/login.html";
    }
}
