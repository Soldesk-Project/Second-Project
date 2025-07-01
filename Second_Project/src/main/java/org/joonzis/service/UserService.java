package org.joonzis.service;

import java.util.List;

import org.joonzis.domain.UsersDTO;

public interface UserService {
	
	// 유저 랭킹 리스트
	public List<UsersDTO> getUserRankingList();
}
