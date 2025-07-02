package org.joonzis.mapper;

import java.util.List;

import org.joonzis.domain.UserInfoDecoDTO;

public interface UserMapper {

	// 유저 랭킹 리스트
	public List<UserInfoDecoDTO> getUserRankingList();
}
