package org.joonzis.service;

import org.joonzis.domain.UsersDTO;
import org.joonzis.mapper.MemberMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MemberServiceImpl implements MemberService {
	
	@Autowired
	private MemberMapper mapper;
	
	// 회원가입
	@Override
	public void insertMember(UsersDTO users) {
		mapper.insertMember(users);
	}

	// 로그인
	@Override
	public boolean isValidUser(String user_id, String user_pw) {
		UsersDTO user = mapper.selectUserByIdAndPw(user_id, user_pw);
        return user != null;
	}
}
