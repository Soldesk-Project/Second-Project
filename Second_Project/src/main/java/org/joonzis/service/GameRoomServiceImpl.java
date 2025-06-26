package org.joonzis.service;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.mapper.GameRoomMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GameRoomServiceImpl implements GameRoomService {
	
	@Autowired
	private GameRoomMapper gameRoomMapper;

	@Override
	public void createGameRoom(GameRoomDTO room) {
		gameRoomMapper.createGameRoom(room);
	}
	
}
