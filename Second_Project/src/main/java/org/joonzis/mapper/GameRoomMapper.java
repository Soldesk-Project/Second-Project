package org.joonzis.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.joonzis.domain.GameRoomDTO;

@Mapper
public interface GameRoomMapper {
	int createGameRoom(GameRoomDTO room);
}
