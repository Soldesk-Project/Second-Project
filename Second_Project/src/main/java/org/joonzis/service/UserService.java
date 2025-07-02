package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.UserInfoDecoDTO;

public interface UserService {
	
	// 유저 랭킹 리스트
	public List<UserInfoDecoDTO> getUserRankingList();
}
