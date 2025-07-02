package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.UserInfoDecoDTO;
import org.joonzis.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@RestController
@Log4j
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {
	
	@Autowired
    private UserService service;

	// 유저 랭킹
	@GetMapping(value = "/ranking", produces = MediaType.APPLICATION_JSON_VALUE)
    public List<UserInfoDecoDTO> getUserRankingList() {
		log.info("🔥 getUserRankingList() 호출됨");
		log.info(service.getUserRankingList());
        return service.getUserRankingList();
    }
}
