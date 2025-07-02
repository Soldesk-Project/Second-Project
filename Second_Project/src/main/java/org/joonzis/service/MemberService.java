package org.joonzis.service;

import org.joonzis.domain.UsersDTO;

public interface MemberService {
	
	// 회원가입
	void insertMember(UsersDTO users);
	
	// 로그인
	UsersDTO isValidUser(String user_id, String user_pw);
	
	// 유저 포인트 조회
	int getUserPoint(String user_id);
	
	// 포인트 구매
	void addPoint(String userId, int amount);
	
	// 유저 정보 조회
	UsersDTO getUserById(String user_id);
}
