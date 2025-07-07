package org.joonzis.controller;

import java.util.List;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.service.GameRoomService;
import org.joonzis.service.match.MatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.extern.log4j.Log4j;

@Log4j
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameRoomController {
	
	@Autowired
	private GameRoomService gameRoomService;
	
	@Autowired
	private MatchService matchService;
	
	// 게임방 생성
	@PostMapping("/createRoom")
	public String createRoom(@RequestBody GameRoomDTO room) {
		log.info(room);
		gameRoomService.createGameRoom(room);
		return "방 생성 완료";
	}
	
	@GetMapping("/showRoom")	
	public List<GameRoomDTO> showRoom() {
	    return gameRoomService.showRoom();
	}	
}
