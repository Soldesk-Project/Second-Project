package org.joonzis.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import lombok.extern.log4j.Log4j;

@Controller
@Log4j
public class SpaController {

	@GetMapping("/reset-password")
	public String forwardResetPassword() {
	    return "forward:/index.html";
	}
}
