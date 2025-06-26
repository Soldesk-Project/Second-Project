package org.joonzis.controller;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.service.GameRoomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class GameRoomController {
	
	@Autowired
	private GameRoomService gameRoomService;
	
	@PostMapping("/createRoom")
	public String createRoom(@RequestBody GameRoomDTO room) {
		gameRoomService.createGameRoom(room);
		return "방 생성 완료";
	}
}
