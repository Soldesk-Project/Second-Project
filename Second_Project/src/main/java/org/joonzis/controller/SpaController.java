package org.joonzis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.log4j.Log4j;

@Controller
public class SpaController {

    @GetMapping(value = "/{path:[^\\.]*}")
    public String forwardAll() {
        return "forward:/index.html";
    }
}
