package org.joonzis.service;

import java.util.List;
import java.util.Map;

import javax.mail.MessagingException;

import org.joonzis.domain.AchievementDTO;
import org.joonzis.domain.ItemVO;
import org.joonzis.domain.UserAccuracyDTO;
import org.joonzis.domain.UserDecoUpdateDTO;
import org.joonzis.domain.UserInfoDTO;
import org.joonzis.domain.UserRewardVO;
import org.joonzis.domain.UsersVO;

public interface UserService {
	
	// Top 10 유저 랭킹 목록
	public List<UserInfoDTO> getUserRankingList();
	
	// 모든 아이템 목록
	public List<ItemVO> getItemList();
	
	// 인벤토리 - 카테고리별 아이템 목록
	public List<ItemVO> getInventoryCategory(Map<String, Object> paramMap);
	
	// 보유 아이템 목록
	public List<ItemVO> getInventory(int user_no);
	
	// userNo로 유저 정보 + deco 찾기	
	public UserInfoDTO getUserInfoByUserNo(int userNo);
	
	// 유저 장식 업데이트	
	public boolean updateItem(UserDecoUpdateDTO UserDecoUpdateDTO);
	
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
	public boolean isUserNickTaken(String user_nick);
	// 회원가입 - 아이디 중복 확인
	public boolean isUserIdTaken(String user_id);
	// 회원가입 - 이메일 중복 확인
	public boolean isUserEmailTaken(String user_email);
	
	// 아이디 찾기
	public String findIdByEmail(String user_email);
	// 비밀번호 찾기
	public String findPwByIdAndEmail(UsersVO vo);
	public UserInfoDTO findUserByIdAndEmail(String id, String email);
	public void updatePassword(UserInfoDTO user);
	public void sendTempPassword(String toEmail, String tempPassword) throws MessagingException;
	
	//유저프로필이미지선택
	public int changeProfileImage(int userNo, String imageUrl);
	
	//유저정보 가져오기
	public UsersVO getUsersByUserNo(int userNo);
	
	// 유저 닉네임 변경
	public void updateNickname(Long user_no, String user_nick);
	
	public void saveResetToken(String userId, String token);
	public UserInfoDTO findUserByToken(String token);
	public boolean tokenExpired(String token);
	public void deleteResetToken(String token);
	
	public void sendResetLinkEmail(String toEmail, String resetLink) throws MessagingException;
	
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
	
	// 유저 접속 정보 업데이트
	public void updateLoginStatus(String userId, int status);

	// 정답률 통계 가져오기
	public List<UserAccuracyDTO> getUserAccuracyList();

	
}
