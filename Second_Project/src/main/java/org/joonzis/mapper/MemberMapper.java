package org.joonzis.mapper;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UsersVO;

public interface MemberMapper {
	
	// 회원가입
	void insertMember(UsersVO users);
	
	// 로그인
	UserInfoDTO selectUserByIdAndPw(@Param("user_id") String user_id, @Param("user_pw") String user_pw);
	
	// 회원 포인트 조회
	int getUserPoint(@Param("user_id") String user_id);
	
	// 포인트 구매
	void updatePoint(@Param("userId") String userId, @Param("amount") int amount);
	
	// 유저 정보 조회
	UserInfoDTO getUserById(@Param("user_id") String user_id);
}
