package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.GameRoomDTO;
import org.joonzis.mapper.GameRoomMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class GameRoomServiceImpl implements GameRoomService {
	
	@Autowired
	private GameRoomMapper gameRoomMapper;
	
	// 게임방 생성
	@Override
	public void createGameRoom(GameRoomDTO room) {
		gameRoomMapper.createGameRoom(room);
	}

	@Override
	public List<GameRoomDTO> showRoom() {
		return gameRoomMapper.showRoom();
	}
	
}
