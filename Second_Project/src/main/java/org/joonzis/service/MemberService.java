package org.joonzis.service;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UsersVO;

public interface MemberService {
	
	// 회원가입
	void insertMember(UsersVO users);
	
	// 로그인
	UserInfoDTO isValidUser(String user_id, String user_pw);
	
	// 유저 포인트 조회
	long getUserPoint(String user_id);
	
	// 포인트 구매
	void addPoint(String userId, int amount);
	
	// 유저 정보 조회
	UserInfoDTO getUserById(String user_id);
}
