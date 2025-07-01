package org.joonzis.mapper;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.UsersDTO;

public interface MemberMapper {
	
	// 회원가입
	void insertMember(UsersDTO users);
	
	// 로그인
	UsersDTO selectUserByIdAndPw(@Param("user_id") String user_id, @Param("user_pw") String user_pw);
	
	// 회원 포인트 조회
	int getUserPoint(@Param("user_id") String user_id);
	
	// 포인트 구매
	void updatePoint(@Param("userId") String userId, @Param("amount") int amount);
}
