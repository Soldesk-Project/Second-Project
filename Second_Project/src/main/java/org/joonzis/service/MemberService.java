package org.joonzis.service;

import org.joonzis.domain.UsersDTO;

public interface MemberService {
	
	// 회원가입
	void insertMember(UsersDTO users);
	
	// 로그인
	UsersDTO isValidUser(String user_id, String user_pw);
}
