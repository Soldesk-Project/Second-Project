package org.joonzis.mapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.apache.ibatis.annotations.Param;
import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAccuracyDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserRewardVO;
import org.joonzis.domain.UsersVO;

public interface UserMapper {

	// Top 10 유저 랭킹 목록
	public List<UserInfoDTO> getUserRankingList();
	
	// 모든 아이템 목록
	public List<ItemVO> getItemList();
	// 인벤토리 - 카테고리별 아이템 목록
	public List<ItemVO> getInventoryCategory(Map<String, Object> paramMap);
	// 보유 아이템 목록
	public List<ItemVO> getInventory(int user_no);
	
	// 유저 장식 업데이트	
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO);
	
	// userNo로 유저 정보+css 찾기
	public UserInfoDTO getUserInfoByUserNo(int userNo);
	
	// 업적 달성 - 포인트 추가
	public int updateUserPoint(AchievementDTO dto);
	
	// 아이템 구매 - 포인트 감소
	public boolean userPointMinus(Map<String, Object> paramMap);
	// 아이템 구매 - 인벤토리에 추가
	public boolean buyItemInventory(Map<String, Object> paramMap);
	
	// 리워드 상태
	public UserRewardVO getRewardStatus(int user_no);
	// 리워드 상태 업데이트
	public boolean rewardUpdate(UserRewardVO UserRewardVO);
	// 리워드 보상 획득
	public boolean addReward(UserDecoUpdateDTO UserDecoUpdateDTO);
	
	// 회원가입 - 닉네임 중복 확인
	public int isUserNickTaken(String user_nick);
	// 회원가입 - 아이디 중복 확인
	public int isUserIdTaken(String user_id);
	// 회원가입 - 이메일 중복 확인
	public int isUserEmailTaken(String user_email);
	
	// 아이디 찾기
	public String findIdByEmail(String user_email);
	// 비밀번호 찾기
	public String findPwByIdAndEmail(UsersVO vo);
	// 비밀번호 업데이트
	public void updatePassword(UserInfoDTO user);
	// 비밀번호 변경 - 유저 확인
	public UserInfoDTO findUserByIdAndEmail(@Param("user_id") String user_id, @Param("user_email") String user_email);
	
	// 유저 닉네임 변경
	public void updateNickname(@Param("user_no") Long user_no, @Param("user_nick") String user_nick);
	
	// 프로필 이미지 업데이트
	int updateProfileImage(@Param("userNo") int userNo,
            @Param("imageUrl") String imageUrl);
	
	//유저정보 가져오기
	public UsersVO getUsersByUserNo(@Param("userNo") int userNo);
	
	//정답률 통계 가져오기
	public List<UserAccuracyDTO> getUserAccuracyList(@Param("user_nick") String user_nick);
	
	
	
	// 비밀번호 변경 - 임시 토큰 생성
	public void insertResetToken(@Param("userId") String userId,
            @Param("token") String token,
            @Param("expiryDate") LocalDateTime expiryDate);
	// 비밀번호 변경 - 토큰으로 유저 정보 찾기
	public UserInfoDTO findUserByToken(String token);
	// 토큰 유효기간 비교
	public LocalDateTime getExpiryByToken(String token);
	// 비밀번호 변경 성공 후 토큰 삭제
	public void deleteToken(String token);
	
	// 회원가입
	int insertMember(UsersVO users);
	// 유저 데코,리워드에 추가
	void insertDeco(int user_no);
	void insertReward(int user_no);
	
	// 로그인
	UserInfoDTO selectUserByIdAndPw(@Param("user_id") String user_id, @Param("user_pw") String user_pw);
	
	// 회원 포인트 조회
	long getUserPoint(@Param("user_id") String user_id);
	
	// 포인트 구매
	void updatePoint(@Param("userId") String userId, @Param("amount") int amount);
	
	// 유저 정보 조회
	UserInfoDTO getUserById(@Param("user_id") String user_id);
	
	// 유저 접속 정보 업데이트
	void updateLoginStatus(@Param("userId") String userId, @Param("status") int status);
}
