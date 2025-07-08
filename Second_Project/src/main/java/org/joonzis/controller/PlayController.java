package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.service.PlayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/play")
@CrossOrigin(origins = "*")
public class PlayController {
	
	@Autowired
    private PlayService playService;
	
	public List<QuestionDTO> getAllQuestions() {
        return playService.getAllQuestions();
    }
}
