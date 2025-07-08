package org.joonzis.controller;

import java.util.Base64;
import java.util.List;

import org.joonzis.domain.QuestionDTO;
import org.joonzis.service.PlayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/play")
@CrossOrigin(origins = "*")
public class PlayController {
	
	@Autowired
    private PlayService playService;
	
	@GetMapping("/questions")
	public List<QuestionDTO> getQuestionsByCategory(@RequestParam(defaultValue = "random") String category) {
	    List<QuestionDTO> list = playService.getQuestionsByCategory(category);

	    for (QuestionDTO dto : list) {
	        if (dto.getImage_data() != null) {
	            String base64 = Base64.getEncoder().encodeToString(dto.getImage_data());
	            dto.setImage_data_base64(base64);  // 새 필드에 담거나, 기존 필드를 문자열로 오버라이드
	        }
	    }

	    return list;
	}
}

