package org.joonzis.service;

import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UsersVO;
import org.joonzis.mapper.MemberMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class MemberServiceImpl implements MemberService {
	
	@Autowired
	private MemberMapper mapper;
	
	// 회원가입
	@Override
	public void insertMember(UsersVO users) {
		mapper.insertMember(users);
	}

	// 로그인
	@Override
	public UserInfoDTO isValidUser(String user_id, String user_pw) {
        return mapper.selectUserByIdAndPw(user_id, user_pw);
	}
	
	// 유저 포인트 조회
	@Override
	public int getUserPoint(String user_id) {
		return mapper.getUserPoint(user_id);
	}
	
	// 포인트 구매
	@Override
	public void addPoint(String userId, int amount) {
		mapper.updatePoint(userId, amount);
	}

	// 유저 정보 조회
	@Override
	public UserInfoDTO getUserById(String user_id) {
		return mapper.getUserById(user_id);
	}
}
