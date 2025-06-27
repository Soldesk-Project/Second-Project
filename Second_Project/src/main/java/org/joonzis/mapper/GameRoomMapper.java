package org.joonzis.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.joonzis.domain.GameRoomDTO;

@Mapper
public interface GameRoomMapper {
	
	// 게임방 생성
	int createGameRoom(GameRoomDTO room);
	
	// 게임 방 정보 가져오기
	List<GameRoomDTO> showRoom();

}
