package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.GameRoomDTO;

public interface GameRoomService {
	
	// 게임방 생성
	void createGameRoom(GameRoomDTO room);
	
	// 게임 방 정보 가져오기
	List<GameRoomDTO> showRoom();
}
